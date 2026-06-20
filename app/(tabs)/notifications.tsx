import { styled } from "nativewind";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const ITEMS = [
  { icon: "🎉", title: "Maya invited you to Friday Night Chaos", time: "2m" },
  { icon: "🪙", title: "You earned 25 tokens for MVP win", time: "1h" },
  { icon: "🔥", title: "Your 5-day streak is on fire — keep it up!", time: "3h" },
  { icon: "👋", title: "Leo just joined Yowimo from your invite (+50 tokens)", time: "1d" },
  { icon: "🎁", title: "Acme is sponsoring a free party tonight at 8pm", time: "2d" },
];

export default function NotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-foreground text-3xl font-bold tracking-tight mt-16">
          Notifications
        </Text>

        <View className="mt-5 gap-2">
          {ITEMS.map((n, i) => (
            <View
              key={i}
              className="flex-row items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-4"
            >
              <Text className="text-2xl">{n.icon}</Text>
              <View className="flex-1">
                <Text className="text-foreground text-sm font-medium leading-snug">
                  {n.title}
                </Text>
                <Text className="mt-1 text-muted-foreground text-[11px]">
                  {n.time} ago
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}