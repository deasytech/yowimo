import GoBack from "@/components/shared/GoBack";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import {
  ChevronDown,
  MessageCircle,
  Search
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

const topics = [
  { emoji: "🎮", title: "Getting Started", count: 12 },
  { emoji: "🪙", title: "Tokens & Wallet", count: 8 },
  { emoji: "👥", title: "Friends & Invites", count: 6 },
  { emoji: "📺", title: "Casting to TV", count: 5 },
  { emoji: "🔒", title: "Privacy & Safety", count: 9 },
  { emoji: "💳", title: "Payments", count: 7 },
];

const faqs = [
  {
    q: "How do I earn tokens?",
    a: "Win MVP awards, complete daily quests, refer friends, or buy tokens directly.",
  },
  {
    q: "Can I cast a party to my TV?",
    a: "Yes. Open Connect to TV and use the code at yowimo.tv or scan the QR code.",
  },
  {
    q: "Is my data safe?",
    a: "We never share your contacts or content. Profiles can be private or public.",
  },
  {
    q: "How do sponsorships work?",
    a: "Brands or hosts can cover token entry fees for select players.",
  },
];

export default function HelpCenterScreen() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <SafeAreaView
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Help Center" />

        {/* Hero */}

        <LinearGradient
          colors={[
            "#7A1EFF",
            "#D84CFF",
            "#FF8A2A",
          ]}
          className="overflow-hidden rounded-3xl p-5 mt-2"
        >
          <Text className="font-sg-bold text-2xl text-white">
            How can we help?
          </Text>

          <View className="relative mt-4">
            <Search
              size={16}
              color="rgba(255,255,255,0.7)"
              style={{
                position: "absolute",
                left: 14,
                top: 14,
                zIndex: 10,
              }}
            />

            <TextInput
              placeholder="Search FAQs..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              className="h-12 rounded-2xl bg-white/15 pl-11 pr-4 text-white"
            />
          </View>
        </LinearGradient>

        {/* Topics */}

        <View className="mt-6">
          <Text className="mb-3 font-sg-bold text-base text-white">
            Browse Topics
          </Text>

          <View className="flex-row flex-wrap justify-between">
            {topics.map((topic) => (
              <TouchableOpacity
                key={topic.title}
                activeOpacity={0.85}
                className="mb-3 w-[48%] rounded-3xl border border-white/10 bg-card p-4"
              >
                <Text className="text-3xl">
                  {topic.emoji}
                </Text>

                <Text className="mt-2 font-sg-bold text-sm text-white">
                  {topic.title}
                </Text>

                <Text className="text-xs text-muted-foreground">
                  {topic.count} articles
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ */}

        <View className="mt-2">
          <Text className="mb-3 font-sg-bold text-base text-white">
            Popular FAQs
          </Text>

          {faqs.map((faq, index) => (
            <View
              key={index}
              className="mb-2 overflow-hidden rounded-2xl border border-white/10 bg-card"
            >
              <TouchableOpacity
                onPress={() =>
                  setOpenFaq(
                    openFaq === index
                      ? null
                      : index
                  )
                }
                className="flex-row items-center justify-between p-4"
              >
                <Text className="flex-1 pr-4 font-sans-semibold text-sm text-white">
                  {faq.q}
                </Text>

                <ChevronDown
                  size={18}
                  color="#FFFFFF"
                  style={{
                    transform: [
                      {
                        rotate:
                          openFaq === index
                            ? "180deg"
                            : "0deg",
                      },
                    ],
                  }}
                />
              </TouchableOpacity>

              {openFaq === index && (
                <Text className="px-4 pb-4 text-sm leading-6 text-muted-foreground">
                  {faq.a}
                </Text>
              )}
            </View>
          ))}
        </View>

      </ScrollView>
      <View className="border-t border-white/10 bg-background px-5 pb-3 pt-2">
        <TouchableOpacity
          activeOpacity={0.9}
          className="mt-5"
        >
          <LinearGradient
            colors={[
              "#7A1EFF",
              "#D84CFF",
            ]}
            className="flex-row items-center justify-center rounded-2xl py-4"
          >
            <MessageCircle
              size={18}
              color="#FFFFFF"
            />

            <Text className="ml-2 font-sans-semibold text-white">
              Chat with Support
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}