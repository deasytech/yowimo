import GoBack from "@/components/shared/GoBack";
import { FRIENDS } from "@/data/mock";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Search, UserPlus } from "lucide-react-native";
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

const TABS = ["All", "Online", "In game"];

export default function FriendsListScreen() {
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");

  const filtered = FRIENDS.filter(
    (f) =>
      (tab === "Online" ? f.online : tab === "In game" ? !!f.inParty : true) &&
      (f.name.toLowerCase().includes(q.toLowerCase()) ||
        f.handle.toLowerCase().includes(q.toLowerCase()))
  );

  const addFriend = () => {
    console.log("Add a friend or friends")
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5">
        <GoBack
          title="Friends"
          rightIcon={UserPlus}
          rightAction={addFriend}
        />
      </View>

      {/* ── Search ── */}
      <View className="px-5 mt-2 mb-4">
        <View className="relative justify-center">
          <View className="absolute left-4 z-10">
            <Search color="#a3a3ab" size={16} strokeWidth={2} />
          </View>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search friends"
            placeholderTextColor="#a3a3ab"
            className="h-12 w-full rounded-2xl border border-border bg-secondary/60 pl-11 pr-4 text-foreground text-sm"
          />
        </View>
      </View>

      {/* ── Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3"
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: "center" }}
      >
        {TABS.map((t) => {
          const active = tab === t;
          return active ? (
            <TouchableOpacity key={t} onPress={() => setTab(t)} activeOpacity={0.85}>
              <LinearGradient
                colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-full px-4 py-2 flex-row items-center"
              >
                <Text className="text-white text-xs font-semibold">{t}</Text>
                {t === "Requests" && (
                  <View className="ml-1 rounded-full bg-orange px-1.5 py-0.5">
                    <Text className="text-white text-[10px] font-bold">2</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
              className="rounded-full bg-secondary/60 px-4 py-2 flex-row items-center"
            >
              <Text className="text-muted-foreground text-xs font-semibold">{t}</Text>
              {t === "Requests" && (
                <View className="ml-1 rounded-full bg-orange px-1.5 py-0.5">
                  <Text className="text-white text-[10px] font-bold">2</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Friends list ── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32,
          gap: 8
        }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((f) => (
          <View
            key={f.id}
            className="flex-row items-center gap-3 rounded-2xl bg-card p-3"
          >
            {/* Avatar */}
            <View className="relative">
              <LinearGradient
                colors={["#7A1EFF", "#B03BFF"]}
                className="h-11 w-11 items-center justify-center rounded-full"
              >
                <Text className="text-white text-sm font-bold">{f.initials}</Text>
              </LinearGradient>
              {f.online && (
                <View
                  className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-orange"
                  style={{ borderWidth: 2, borderColor: "#101015" }}
                />
              )}
            </View>

            {/* Name + status */}
            <View className="flex-1">
              <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                {f.name}
              </Text>
              <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                {f.inParty ? `🎮 In ${f.inParty}` : f.handle}
              </Text>
            </View>

            {/* Level badge */}
            <View className="rounded-full bg-secondary px-2 py-0.5">
              <Text className="text-foreground text-[10px] font-bold">LVL {f.level}</Text>
            </View>

            {/* Invite */}
            <TouchableOpacity activeOpacity={0.85} onPress={() => { }}>
              <LinearGradient
                colors={["#7A1EFF", "#B03BFF"]}
                className="rounded-xl px-3 py-1.5"
              >
                <Text className="text-white text-xs font-semibold">Invite</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}