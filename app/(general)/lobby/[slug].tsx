import GoBack from "@/components/shared/GoBack";
import { FRIENDS, PARTIES } from "@/data/mock";
import * as Clipboard from "expo-clipboard";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import {
  Copy,
  QrCode,
  Settings2,
  Share2,
  Sparkles,
  Users,
  Video,
} from "lucide-react-native";
import { styled } from "nativewind";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

const SETTINGS_ROWS = [
  { Icon: Sparkles, label: "AI Host", value: "On · Spicy mode", colorClass: "text-orange", to: "/ai-host" },
  { Icon: Users, label: "Teams", value: "Free for all", colorClass: "text-foreground", to: "/teams" },
  { Icon: Settings2, label: "Seating", value: "Auto · 6 players", colorClass: "text-foreground", to: "/seating" },
  { Icon: Video, label: "Live video room", value: "Tap to join", colorClass: "text-foreground", to: "/video-room" },
  { Icon: Settings2, label: "Waiting room", value: "3 waiting", colorClass: "text-foreground", to: "/waiting" },
  { Icon: Users, label: "Local players", value: "Add device", colorClass: "text-foreground", to: "/local-register" },
];

export default function LobbyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const party = PARTIES.find((p) => p.id === id) ?? PARTIES[0];

  const handleCopy = async () => {
    await Clipboard.setStringAsync("YW-7K2");
    // Swap for your toast system
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Lobby" />

        {/* ── Hero card ── */}
        <LinearGradient
          colors={party.cover ?? ["#7A1EFF", "#D84CFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mt-4 rounded-3xl p-6 overflow-hidden"
        >
          <View className="self-start rounded-full bg-ink/40 px-3 py-1">
            <Text
              className="text-white text-[11px] font-semibold uppercase"
              style={{ letterSpacing: 0.5 }}
            >
              {party.type} · {party.mode}
            </Text>
          </View>
          <Text className="mt-3 text-white text-3xl font-bold leading-tight">
            {party.title}
          </Text>
          <Text className="mt-1 text-white/80 text-sm">Hosted by {party.host}</Text>
        </LinearGradient>

        {/* ── Code + QR ── */}
        <View className="mt-5 flex-row gap-3">
          <View
            style={{ flex: 2 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <Text
              className="text-muted-foreground text-[11px] uppercase"
              style={{ letterSpacing: 0.5 }}
            >
              Room code
            </Text>
            <Text
              className="mt-1 text-violet-bright text-3xl font-black"
              style={{ letterSpacing: 6 }}
            >
              YW-7K2
            </Text>

            <View className="mt-3 flex-row gap-2">
              <TouchableOpacity
                onPress={handleCopy}
                activeOpacity={0.8}
                className="flex-row items-center gap-1 rounded-full bg-secondary px-3 py-1.5"
              >
                <Copy color="#fff" size={12} strokeWidth={2} />
                <Text className="text-foreground text-xs font-medium">Copy</Text>
              </TouchableOpacity>

              <Link href="/" asChild>
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="flex-row items-center gap-1 rounded-full bg-secondary px-3 py-1.5"
                >
                  <Share2 color="#fff" size={12} strokeWidth={2} />
                  <Text className="text-foreground text-xs font-medium">Invite</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          <Link href="/" asChild>
            <TouchableOpacity
              activeOpacity={0.8}
              style={{ flex: 1 }}
              className="items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <QrCode color="#fff" size={36} strokeWidth={1.8} />
              <Text className="mt-1 text-muted-foreground text-[10px] font-medium text-center">
                Scan to join
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* ── Players ── */}
        <View className="mt-7">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-foreground text-lg font-bold">
              In the room · {party.players}/{party.maxPlayers}
            </Text>
            <Link href="/" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-violet-bright text-xs font-medium">Invite more</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {FRIENDS.slice(0, 7).map((f) => (
              <View key={f.id} style={{ width: "21%" }} className="items-center">
                <View className="relative">
                  <LinearGradient
                    colors={["#7A1EFF", "#B03BFF"]}
                    className="h-14 w-14 items-center justify-center rounded-2xl"
                  >
                    <Text className="text-white text-sm font-bold">{f.initials}</Text>
                  </LinearGradient>
                  <View
                    className="absolute rounded-full bg-orange px-1.5 py-0.5"
                    style={{
                      bottom: -4,
                      right: -4,
                      borderWidth: 2,
                      borderColor: "#101015",
                    }}
                  >
                    <Text className="text-ink text-[9px] font-bold">{f.level}</Text>
                  </View>
                </View>
                <Text
                  className="mt-1 text-foreground text-[10px] font-medium"
                  numberOfLines={1}
                >
                  {f.name.split(" ")[0]}
                </Text>
              </View>
            ))}

            <TouchableOpacity
              activeOpacity={0.8}
              style={{ width: "21%" }}
              className="items-center gap-1"
            >
              <View
                className="h-14 w-14 items-center justify-center rounded-2xl"
                style={{ borderWidth: 2, borderColor: "#2e2e38", borderStyle: "dashed" }}
              >
                <Text className="text-muted-foreground text-2xl">+</Text>
              </View>
              <Text className="text-muted-foreground text-[10px]">Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Settings rows ── */}
        <View className="mt-7 gap-3">
          {SETTINGS_ROWS.map((s) => (
            <Link key={s.label} href={s.to as any} asChild>
              <TouchableOpacity
                activeOpacity={0.8}
                className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <s.Icon
                  color={s.colorClass === "text-orange" ? "#FF8A2A" : "#fff"}
                  size={20}
                  strokeWidth={2}
                />
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">{s.label}</Text>
                  <Text className="text-muted-foreground text-xs">{s.value}</Text>
                </View>
                <Text className="text-muted-foreground text-xs">›</Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>

        {/* ── Start game CTA ── */}
        <TouchableOpacity
          onPress={() => router.push("/")}
          activeOpacity={0.85}
          className="mt-8"
        >
          <LinearGradient
            colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-14 w-full items-center justify-center rounded-2xl"
          >
            <Text className="text-white text-base font-semibold">
              Start game · 5 ready
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}