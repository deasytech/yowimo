import { useProfile, useUpdateProfile } from "@/hooks/api/useProfile";
import { ApiError } from "@/lib/api/types";
import { COUNTRIES, type Country } from "@/data/countries";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  Search,
} from "lucide-react-native";
import { styled } from "nativewind";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

// ─── Date helpers (local calendar dates, no UTC drift) ─────────────────────────
const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseISODate = (s: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
};

const formatDisplayDate = (s: string) => {
  const d = parseISODate(s);
  if (!d) return s;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

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

const PRIVACY_ROWS = [
  { key: "isPublic", label: "Public profile", sub: "Anyone can view your profile" },
  { key: "showOnLeaderboard", label: "Show on leaderboard", sub: "Appear in rankings" },
  { key: "allowFriendRequests", label: "Friend requests", sub: "Let others add you" },
  { key: "discoverable", label: "Discoverable", sub: "Suggest me to others" },
] as const;

type PrivacyKey = (typeof PRIVACY_ROWS)[number]["key"];
type PrivacySettings = Record<PrivacyKey, boolean>;

const DEFAULT_PRIVACY: PrivacySettings = {
  isPublic: true,
  showOnLeaderboard: true,
  allowFriendRequests: true,
  discoverable: true,
};

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
  autoCapitalize,
  multiline,
  numberOfLines,
}: {
  value: string;
  onChangeText: (v: string) => void;
  maxLength?: number;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "characters" | "words" | "sentences";
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
    autoCapitalize={autoCapitalize}
    multiline={multiline}
    numberOfLines={numberOfLines}
  />
);

// ─── Edit Profile ─────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [form, setForm] = useState({
    displayName: "",
    username: "",
    bio: "",
    dateOfBirth: "",
    countryCode: "",
    interests: [] as string[],
    privacy: DEFAULT_PRIVACY,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [draftDate, setDraftDate] = useState(() => new Date());

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  // Prefill once the real profile first loads — the ref guard stops a later refetch
  // (focus refetch, background refresh) from clobbering in-progress edits.
  const hasPrefilled = useRef(false);
  useEffect(() => {
    if (!profile || hasPrefilled.current) return;
    hasPrefilled.current = true;
    setForm({
      displayName: profile.display_name ?? "",
      username: profile.username ?? "",
      bio: profile.bio ?? "",
      dateOfBirth: profile.date_of_birth ?? "",
      countryCode: profile.country_code ?? "",
      interests: profile.interests ?? [],
      privacy: { ...DEFAULT_PRIVACY, ...(profile.privacy_settings as Partial<PrivacySettings>) },
    });
  }, [profile]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const updatePrivacy = (key: PrivacyKey, value: boolean) =>
    setForm((f) => ({ ...f, privacy: { ...f.privacy, [key]: value } }));

  const toggleInterest = (i: string) =>
    update(
      "interests",
      form.interests.includes(i)
        ? form.interests.filter((x) => x !== i)
        : [...form.interests, i]
    );

  const initials = (form.displayName || profile?.username || "U").charAt(0).toUpperCase();

  const selectedCountry = COUNTRIES.find((c) => c.code === form.countryCode);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  const openDatePicker = () => {
    setDraftDate(parseISODate(form.dateOfBirth) ?? new Date(2000, 0, 1));
    setShowDatePicker(true);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate) {
        update("dateOfBirth", toISODate(selectedDate));
      }
      return;
    }
    if (selectedDate) setDraftDate(selectedDate);
  };

  const confirmIosDate = () => {
    update("dateOfBirth", toISODate(draftDate));
    setShowDatePicker(false);
  };

  const closeCountryPicker = () => {
    setShowCountryPicker(false);
    setCountrySearch("");
  };

  const selectCountry = (country: Country) => {
    update("countryCode", country.code);
    closeCountryPicker();
  };

  const onSave = () => {
    if (!form.displayName.trim() || !form.username.trim()) {
      Alert.alert("Missing info", "Name and username are required.");
      return;
    }

    updateProfile.mutate(
      {
        display_name: form.displayName.trim(),
        username: form.username.trim(),
        bio: form.bio.trim() || null,
        date_of_birth: form.dateOfBirth.trim() || null,
        country_code: form.countryCode.trim().toUpperCase() || null,
        interests: form.interests,
        privacy_settings: form.privacy,
      },
      {
        onSuccess: () => {
          router.replace("/profile");
        },
        onError: (error) => {
          const message =
            error instanceof ApiError
              ? error.firstValidationError ?? error.message
              : "Something went wrong. Please try again.";
          Alert.alert("Couldn't save profile", message);
        },
      }
    );
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

          {isLoading ? (
            <View className="mt-10 items-center">
              <ActivityIndicator color="#B03BFF" />
            </View>
          ) : (
            <>
              {/* ── Avatar ── */}
              <View className="mt-6 items-center">
                <View className="rounded-full bg-background p-1.5">
                  <LinearGradient
                    colors={["#7A1EFF", "#B03BFF"]}
                    className="h-28 w-28 items-center justify-center rounded-full"
                  >
                    <Text className="text-white text-5xl font-black">{initials}</Text>
                  </LinearGradient>
                </View>
                <View
                  className="absolute bottom-8 right-33 h-9 w-9 items-center justify-center rounded-full bg-secondary"
                  style={{ borderWidth: 3, borderColor: "#101015" }}
                >
                  <Camera color="#a3a3ab" size={16} strokeWidth={2} />
                </View>
                <Text className="mt-3 text-muted-foreground text-xs text-center">
                  Photo uploads aren&apos;t supported yet
                </Text>
              </View>

              {/* ── About you ── */}
              <View className="mt-7 gap-4">
                <Text className="text-foreground text-base font-semibold">About you</Text>

                <Field label="Display name">
                  <FormInput
                    value={form.displayName}
                    onChangeText={(v) => update("displayName", v)}
                    maxLength={100}
                  />
                </Field>

                <Field label="Username">
                  <View className="flex-row items-center rounded-xl bg-input border border-border px-3.5">
                    <Text className="text-muted-foreground text-sm">@</Text>
                    <TextInput
                      className="flex-1 py-3 pl-1 text-foreground text-sm"
                      value={form.username}
                      maxLength={32}
                      autoCapitalize="none"
                      onChangeText={(v) =>
                        update("username", v.replace(/[^a-zA-Z0-9_.]/g, ""))
                      }
                      placeholderTextColor="#a3a3ab"
                    />
                  </View>
                </Field>

                <Field label="Bio">
                  <FormInput
                    value={form.bio}
                    onChangeText={(v) => update("bio", v)}
                    maxLength={1000}
                    multiline
                    numberOfLines={3}
                  />
                  <Text className="text-muted-foreground text-[10px] text-right">
                    {form.bio.length}/1000
                  </Text>
                </Field>
              </View>

              {/* ── Personal ── */}
              <View className="mt-7 gap-4">
                <Text className="text-foreground text-base font-semibold">Personal</Text>

                <Field label="Birthday">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={openDatePicker}
                    className="flex-row items-center justify-between rounded-xl bg-input border border-border px-3.5 py-3"
                  >
                    <Text
                      className={`text-sm ${form.dateOfBirth ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {form.dateOfBirth ? formatDisplayDate(form.dateOfBirth) : "Select your birthday"}
                    </Text>
                    <Calendar color="#a3a3ab" size={16} strokeWidth={2} />
                  </TouchableOpacity>
                </Field>

                <Field label="Country">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowCountryPicker(true)}
                    className="flex-row items-center justify-between rounded-xl bg-input border border-border px-3.5 py-3"
                  >
                    <Text
                      className={`text-sm ${selectedCountry ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {selectedCountry ? `${selectedCountry.name} (${selectedCountry.code})` : "Select your country"}
                    </Text>
                    <ChevronDown color="#a3a3ab" size={16} strokeWidth={2} />
                  </TouchableOpacity>
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
                      value={form.privacy[row.key]}
                      onValueChange={(v) => updatePrivacy(row.key, v)}
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
                  disabled={updateProfile.isPending}
                  style={{ flex: 1.4 }}
                >
                  <LinearGradient
                    colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-14 items-center justify-center rounded-2xl"
                  >
                    {updateProfile.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text className="text-white text-sm font-semibold">Save changes</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Date of birth picker ── */}
      {Platform.OS === "android" ? (
        showDatePicker && (
          <DateTimePicker
            value={draftDate}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={onDateChange}
          />
        )
      ) : (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            />
            <View className="bg-card rounded-t-3xl px-6 pt-6 pb-10">
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text className="text-muted-foreground text-sm font-semibold">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-foreground text-base font-bold">Birthday</Text>
                <TouchableOpacity onPress={confirmIosDate}>
                  <Text className="text-violet-bright text-sm font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={onDateChange}
                textColor="#ffffff"
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* ── Country picker ── */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={closeCountryPicker}
      >
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
            activeOpacity={1}
            onPress={closeCountryPicker}
          />
          <View className="bg-card rounded-t-3xl px-6 pt-6 pb-6" style={{ maxHeight: "75%" }}>
            <Text className="text-foreground text-lg font-bold mb-4">Select country</Text>

            <View className="flex-row items-center rounded-xl bg-input border border-border px-3.5 mb-3">
              <Search color="#a3a3ab" size={16} strokeWidth={2} />
              <TextInput
                className="flex-1 py-3 pl-2 text-foreground text-sm"
                value={countrySearch}
                onChangeText={setCountrySearch}
                placeholder="Search countries"
                placeholderTextColor="#a3a3ab"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => selectCountry(item)}
                  className="flex-row items-center justify-between py-3"
                  style={{ borderBottomWidth: 1, borderBottomColor: "#2e2e38" }}
                >
                  <Text className="text-foreground text-sm">{item.name}</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-muted-foreground text-xs">{item.code}</Text>
                    {item.code === form.countryCode && (
                      <Check color="#B03BFF" size={14} strokeWidth={2.5} />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text className="text-muted-foreground text-sm text-center py-8">
                  No countries found
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
