import GoBack from "@/components/shared/GoBack";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import {
  Heart,
  MessageCircle,
  Send,
  Share2,
} from "lucide-react-native";
import { styled } from "nativewind";
import { useState } from "react";
import {
  LayoutChangeEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

interface Clip {
  who: string;
  caption: string;
  emoji: string;
  colors: readonly [string, string, string];
}

const CLIPS: Clip[] = [
  {
    who: "Maya",
    caption: "When the dare hit DIFFERENT",
    emoji: "💀",
    colors: ["#7A1EFF", "#D84CFF", "#FF8A2A"],
  },
  {
    who: "Leo",
    caption: "POV: you got the wild card 🃏",
    emoji: "🔥",
    colors: ["#FF8A2A", "#D84CFF", "#7A1EFF"],
  },
  {
    who: "Alex",
    caption: "Mustard challenge, do not recommend",
    emoji: "🥄",
    colors: ["#D84CFF", "#7A1EFF", "#2D2A8F"],
  },
];

export default function PartyHighlights() {
  const { width } = useWindowDimensions();
  const [pageHeight, setPageHeight] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setPageHeight(event.nativeEvent.layout.height);
  };

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top", "bottom"]}>
      <View className="px-5">
        <GoBack title="Highlights" />
      </View>

      <View className="flex-1" onLayout={handleLayout}>
        {pageHeight > 0 && (
          <ScrollView
            pagingEnabled
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={pageHeight}
            bounces={false}
          >
            {CLIPS.map((clip, i) => (
              <View
                key={clip.who}
                style={{ width, height: pageHeight }}
                className="relative overflow-hidden"
              >
                <LinearGradient
                  colors={clip.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="absolute inset-0"
                />

                {/* Decorative glow */}
                <View
                  pointerEvents="none"
                  className="absolute -top-16 left-1/3 h-72 w-72 rounded-full bg-white/15"
                />

                <View className="absolute inset-0 items-center justify-center">
                  <Text style={{ fontSize: 160 }}>{clip.emoji}</Text>
                </View>

                {/* Caption */}
                <View className="absolute bottom-24 left-5 right-20">
                  <View className="flex-row items-center gap-2">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                      <Text className="font-sans-bold text-white">
                        {clip.who[0]}
                      </Text>
                    </View>

                    <View>
                      <Text className="font-sans-bold text-sm text-white">
                        @{clip.who.toLowerCase()}
                      </Text>

                      <Text className="text-[11px] text-white/80">
                        Friday Night Chaos · {i + 1}/{CLIPS.length}
                      </Text>
                    </View>
                  </View>

                  <Text className="mt-3 font-sg-bold text-lg leading-tight text-white">
                    {clip.caption}
                  </Text>

                  <View className="mt-2 flex-row gap-1.5">
                    <View className="rounded-full bg-ink/40 px-2 py-0.5">
                      <Text className="text-[10px] text-white">#dare</Text>
                    </View>

                    <View className="rounded-full bg-ink/40 px-2 py-0.5">
                      <Text className="text-[10px] text-white">#yowimo</Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View className="absolute bottom-32 right-4 items-center gap-5">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="items-center"
                    accessibilityRole="button"
                    accessibilityLabel="Like this clip"
                  >
                    <Heart size={28} color="#FFFFFF" strokeWidth={2} />
                    <Text className="mt-1 font-sans-bold text-[10px] text-white">
                      2.4k
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="items-center"
                    accessibilityRole="button"
                    accessibilityLabel="View comments"
                  >
                    <MessageCircle size={28} color="#FFFFFF" strokeWidth={2} />
                    <Text className="mt-1 font-sans-bold text-[10px] text-white">
                      128
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="items-center"
                    accessibilityRole="button"
                    accessibilityLabel="Share this clip"
                  >
                    <Send size={28} color="#FFFFFF" strokeWidth={2} />
                    <Text className="mt-1 font-sans-bold text-[10px] text-white">
                      Share
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="items-center"
                    accessibilityRole="button"
                    accessibilityLabel="Save this clip"
                  >
                    <Share2 size={28} color="#FFFFFF" strokeWidth={2} />
                    <Text className="mt-1 font-sans-bold text-[10px] text-white">
                      Save
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
