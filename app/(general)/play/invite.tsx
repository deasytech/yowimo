import { FRIENDS } from '@/data/mock';
import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Copy, Link2, MessageCircle, QrCode, Send, Share2 } from 'lucide-react-native';
import { styled } from 'nativewind';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

const channels = [
  { id: "wa", label: "WhatsApp", icon: MessageCircle, colors: ["#10B981", "#059669"] as const },
  { id: "tg", label: "Telegram", icon: Send, colors: ["#0EA5E9", "#0284C7"] as const },
  { id: "sms", label: "SMS", icon: MessageCircle, colors: ["#7A1EFF", "#A855F7"] as const },
  { id: "link", label: "Copy link", icon: Link2, colors: ["#D84CFF", "#FF8A2A"] as const },
  { id: "qr", label: "QR code", icon: QrCode, colors: ["#312E81", "#7A1EFF"] as const },
  { id: "more", label: "Share", icon: Share2, colors: ["#FF8A2A", "#D84CFF"] as const },
];

const InviteFriendsScreen = () => {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) => setPicked((p) => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          >
            <ArrowLeft color="#fff" size={16} />
          </TouchableOpacity>

          <Text className="text-lg font-sans-bold text-white">
            Invite Friends
          </Text>

          <View className="w-10" />
        </View>

        {/* Party Link Hero Card */}
        <LinearGradient
          colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
          className="mt-4 overflow-hidden rounded-3xl p-5"
        >
          <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />

          <Text className="text-xs font-sans-bold uppercase tracking-wider text-white/80">
            Party Link
          </Text>

          <View className="mt-3 flex-row items-center justify-between">
            <Text
              numberOfLines={1}
              className="flex-1 text-lg font-sans-bold text-white"
            >
              yowimo.app/p/FRD9X2
            </Text>

            <TouchableOpacity className="ml-3 h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <Copy color="#fff" size={16} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Share Channels */}
        <View className="mt-6">
          <Text className="mb-4 text-lg font-sans-bold text-white">
            Share Via
          </Text>

          <View className="flex-row flex-wrap">
            {channels.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                className="mb-5 w-1/3 items-center"
              >
                <LinearGradient
                  colors={item.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="h-16 w-16 items-center justify-center rounded-2xl"
                >
                  <item.icon
                    color="#fff"
                    size={24}
                    strokeWidth={2.3}
                  />
                </LinearGradient>

                <Text className="mt-2 text-center text-xs text-white/80">
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Friends List */}
        <View className="mt-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-sans-bold text-white">
              From Your Crew
            </Text>

            <Text className="text-sm text-muted-foreground">
              {picked.length} selected
            </Text>
          </View>

          {FRIENDS.map((friend) => {
            const selected = picked.includes(friend.id);

            return (
              <TouchableOpacity
                key={friend.id}
                onPress={() => toggle(friend.id)}
                activeOpacity={0.8}
                className={`mb-3 flex-row items-center rounded-2xl border p-3 ${selected
                  ? "border-violet-bright bg-violet/20"
                  : "border-transparent bg-card"
                  }`}
              >
                <View className="relative">
                  <LinearGradient
                    colors={["#7A1EFF", "#D84CFF"]}
                    className="h-11 w-11 items-center justify-center rounded-full"
                  >
                    <Text className="font-sans-bold text-white">
                      {friend.initials}
                    </Text>
                  </LinearGradient>

                  {friend.online && (
                    <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-accent" />
                  )}
                </View>

                <View className="ml-3 flex-1">
                  <Text className="font-sans-semibold text-white">
                    {friend.name}
                  </Text>

                  <Text className="text-xs text-muted-foreground">
                    {friend.handle}
                  </Text>
                </View>

                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border-2 ${selected
                    ? "border-violet-bright bg-violet-bright"
                    : "border-muted"
                    }`}
                >
                  {selected && (
                    <Text className="text-xs font-bold text-white">
                      ✓
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* CTA Button */}
      <View className="border-t border-white/10 bg-background px-5 pb-3 pt-4">
        <LinearGradient
          colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="overflow-hidden rounded-2xl"
        >
          <TouchableOpacity
            className="h-14 items-center justify-center"
            activeOpacity={0.9}
          >
            <Text className="text-base font-sans-bold text-white">
              Send Invites ({picked.length || "Skip"})
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  )
}

export default InviteFriendsScreen
