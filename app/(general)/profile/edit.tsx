import * as ImagePicker from "expo-image-picker";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { ArrowLeft, Camera, Check, ChevronDown } from "lucide-react-native";
import { styled } from "nativewind";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

const INTERESTS = [
  "Truth or Dare",
  "Trivia",
  "Charades",
  "Couples",
  "Corporate",
  "Music",
  "Movies",
  "Wild",
  "Chill",
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
  { value: "pt", label: "Português" },
];

const PARTY_TYPES = ["Chill", "Medium", "Wild"];

const PRIVACY_ROWS = [
  { key: "isPublic", label: "Public profile", sub: "Anyone can view your profile" },
  { key: "showOnLeaderboard", label: "Show on leaderboard", sub: "Appear in rankings" },
  { key: "allowFriendRequests", label: "Friend requests", sub: "Let others add you" },
  { key: "discoverable", label: "Discoverable", sub: "Suggest me to others" },
] as const;

// ─── Reusable field wrapper ───────────────────────────────────────────────────
const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <View className="gap-1.5">
    <Text className="text-foreground text-sm font-medium">{label}</Text>
    {children}
  </View>
);

// ─── Reusable text input ──────────────────────────────────────────────────────
const FormInput = ({
  value,
  onChangeText,
  maxLength,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
}: {
  value: string;
  onChangeText: (v: string) => void;
  maxLength?: number;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  multiline?: boolean;
  numberOfLines?: number;
}) => (
  <TextInput
    className="rounded-xl bg-input border border-border px-3.5 py-3 text-foreground text-sm"
    style={multiline ? { minHeight: 80, textAlignVertical: "top" } : undefined}
    value={value}
    onChangeText={onChangeText}
    maxLength={maxLength}
    placeholder={placeholder}
    placeholderTextColor="#a3a3ab"
    keyboardType={keyboardType ?? "default"}
    multiline={multiline}
    numberOfLines={numberOfLines}
  />
);

// ─── Picker (Select replacement) ──────────────────────────────────────────────
const FormPicker = ({
  value,
  options,
  onSelect,
}: {
  value: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        className="flex-row items-center justify-between rounded-xl bg-input border border-border px-3.5 py-3"
      >
        <Text className="text-foreground text-sm">{selectedLabel}</Text>
        <ChevronDown color="#a3a3ab" size={16} strokeWidth={2} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          className="flex-1 justify-end bg-black/60"
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View className="bg-card rounded-t-3xl p-2 pb-8">
            {options.map((o) => (
              <TouchableOpacity
                key={o.value}
                onPress={() => {
                  onSelect(o.value);
                  setOpen(false);
                }}
                activeOpacity={0.7}
                className="flex-row items-center justify-between px-4 py-3.5 rounded-xl"
              >
                <Text className="text-foreground text-sm">{o.label}</Text>
                {o.value === value && <Check color="#B03BFF" size={16} strokeWidth={2.5} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// ─── Edit Profile ─────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(null);

  const [form, setForm] = useState({
    displayName: "Alex Chen",
    username: "alex",
    pronouns: "they/them",
    bio: "Designer by day, dare-survivor by night. #partytype",
    email: "alex@yowimo.app",
    phone: "+81 90 1234 5678",
    birthday: "1998-04-12",
    location: "Tokyo",
    language: "en",
    partyType: "Wild",
    interests: ["Truth or Dare", "Wild"] as string[],
    isPublic: true,
    showOnLeaderboard: true,
    allowFriendRequests: true,
    discoverable: true,
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleInterest = (i: string) =>
    update(
      "interests",
      form.interests.includes(i)
        ? form.interests.filter((x) => x !== i)
        : [...form.interests, i]
    );

  const onPickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Optional: enforce a max size client-side once you read file size via expo-file-system
      setAvatar(result.assets[0].uri);
    }
  };

  const onSave = () => {
    if (!form.displayName.trim() || !form.username.trim()) {
      // Swap for your toast system
      console.warn("Missing info: Name and username are required.");
      return;
    }
    // Swap for your toast system
    console.log("Profile updated");
    router.push("/profile");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Title row ── */}
          <View className="flex-row items-center gap-3 mt-2">
            <Link href="/profile" asChild>
              <TouchableOpacity
                activeOpacity={0.8}
                className="h-9 w-9 items-center justify-center rounded-full bg-card border border-border"
              >
                <ArrowLeft color="#fff" size={16} strokeWidth={2} />
              </TouchableOpacity>
            </Link>
            <View>
              <Text className="text-foreground text-2xl font-bold tracking-tight">
                Edit profile
              </Text>
              <Text className="text-muted-foreground text-xs">
                Update your details and vibe.
              </Text>
            </View>
          </View>

          {/* ── Avatar ── */}
          <View className="mt-6 items-center">
            <TouchableOpacity onPress={onPickAvatar} activeOpacity={0.85}>
              <View className="rounded-full bg-background p-1.5">
                {avatar ? (
                  <Image
                    source={{ uri: avatar }}
                    className="h-28 w-28 rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={["#7A1EFF", "#B03BFF"]}
                    className="h-28 w-28 items-center justify-center rounded-full"
                  >
                    <Text className="text-white text-5xl font-black">
                      {form.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
              </View>

              <LinearGradient
                colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="absolute bottom-1 right-1 h-9 w-9 items-center justify-center rounded-full"
                style={{ borderWidth: 3, borderColor: "#101015" }}
              >
                <Camera color="#fff" size={16} strokeWidth={2} />
              </LinearGradient>
            </TouchableOpacity>
            <Text className="mt-3 text-muted-foreground text-xs">
              Tap to change photo · max 5MB
            </Text>
          </View>

          {/* ── About you ── */}
          <View className="mt-7 gap-4">
            <Text className="text-foreground text-base font-semibold">About you</Text>

            <Field label="Display name">
              <FormInput
                value={form.displayName}
                onChangeText={(v) => update("displayName", v)}
                maxLength={50}
              />
            </Field>

            <Field label="Username">
              <View className="flex-row items-center rounded-xl bg-input border border-border px-3.5">
                <Text className="text-muted-foreground text-sm">@</Text>
                <TextInput
                  className="flex-1 py-3 pl-1 text-foreground text-sm"
                  value={form.username}
                  maxLength={20}
                  onChangeText={(v) =>
                    update("username", v.replace(/[^a-z0-9_]/gi, "").toLowerCase())
                  }
                  placeholderTextColor="#a3a3ab"
                />
              </View>
            </Field>

            <Field label="Pronouns">
              <FormInput
                value={form.pronouns}
                onChangeText={(v) => update("pronouns", v)}
                maxLength={20}
                placeholder="she/her, he/him, they/them..."
              />
            </Field>

            <Field label="Bio">
              <FormInput
                value={form.bio}
                onChangeText={(v) => update("bio", v)}
                maxLength={160}
                multiline
                numberOfLines={3}
              />
              <Text className="text-muted-foreground text-[10px] text-right">
                {form.bio.length}/160
              </Text>
            </Field>
          </View>

          {/* ── Contact ── */}
          <View className="mt-7 gap-4">
            <Text className="text-foreground text-base font-semibold">Contact</Text>

            <Field label="Email">
              <FormInput
                value={form.email}
                onChangeText={(v) => update("email", v)}
                keyboardType="email-address"
              />
            </Field>

            <Field label="Phone">
              <FormInput
                value={form.phone}
                onChangeText={(v) => update("phone", v)}
                keyboardType="phone-pad"
              />
            </Field>
          </View>

          {/* ── Personal ── */}
          <View className="mt-7 gap-4">
            <Text className="text-foreground text-base font-semibold">Personal</Text>

            <Field label="Birthday">
              {/* RN has no native date input — wire to a date picker library, e.g. @react-native-community/datetimepicker */}
              <FormInput
                value={form.birthday}
                onChangeText={(v) => update("birthday", v)}
                placeholder="YYYY-MM-DD"
              />
            </Field>

            <Field label="Location">
              <FormInput
                value={form.location}
                onChangeText={(v) => update("location", v)}
                maxLength={60}
              />
            </Field>

            <Field label="Language">
              <FormPicker
                value={form.language}
                options={LANGUAGES}
                onSelect={(v) => update("language", v)}
              />
            </Field>

            <Field label="Party type">
              <FormPicker
                value={form.partyType}
                options={PARTY_TYPES.map((p) => ({ value: p, label: p }))}
                onSelect={(v) => update("partyType", v)}
              />
            </Field>
          </View>

          {/* ── Interests ── */}
          <View className="mt-7">
            <Text className="mb-3 text-foreground text-base font-semibold">Interests</Text>
            <View className="flex-row flex-wrap gap-2">
              {INTERESTS.map((i) => {
                const active = form.interests.includes(i);
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => toggleInterest(i)}
                    activeOpacity={0.8}
                    className={`flex-row items-center gap-1 rounded-full border px-3 py-1.5 ${active
                      ? "border-violet-bright bg-violet/20"
                      : "border-border bg-secondary/40"
                      }`}
                  >
                    {active && <Check color="#fff" size={12} strokeWidth={2.5} />}
                    <Text
                      className={`text-xs font-semibold ${active ? "text-foreground" : "text-muted-foreground"
                        }`}
                    >
                      {i}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Privacy ── */}
          <View className="mt-7 rounded-3xl bg-card overflow-hidden">
            {PRIVACY_ROWS.map((row, idx) => (
              <View
                key={row.key}
                className="flex-row items-center gap-3 p-4"
                style={
                  idx > 0
                    ? { borderTopWidth: 1, borderTopColor: "#2e2e38" }
                    : undefined
                }
              >
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">{row.label}</Text>
                  <Text className="text-muted-foreground text-[11px]">{row.sub}</Text>
                </View>
                <Switch
                  value={form[row.key]}
                  onValueChange={(v) => update(row.key, v)}
                  trackColor={{ false: "#2c2c32", true: "#7A1EFF" }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#2c2c32"
                />
              </View>
            ))}
          </View>

          {/* ── Actions ── */}
          <View className="mt-8 flex-row gap-3">
            <Link href="/profile" asChild>
              <TouchableOpacity
                activeOpacity={0.8}
                className="flex-1 h-14 items-center justify-center rounded-2xl border border-border"
              >
                <Text className="text-foreground text-sm font-semibold">Cancel</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              onPress={onSave}
              activeOpacity={0.85}
              style={{ flex: 1.4 }}
            >
              <LinearGradient
                colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-14 items-center justify-center rounded-2xl"
              >
                <Text className="text-white text-sm font-semibold">Save changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}