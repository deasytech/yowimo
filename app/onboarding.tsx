import { COUNTRIES, type Country } from "@/data/countries";
import { useGameTypes } from "@/hooks/api/useGameTypes";
import { useProfile, useUpdateProfile } from "@/hooks/api/useProfile";
import { ApiError } from "@/lib/api/types";
import { posthog } from "@/lib/posthog";
import { isProfileSetupComplete } from "@/lib/utils";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import { Calendar, Check, ChevronDown, Search } from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text className="text-muted-foreground text-xs font-semibold">{label}</Text>
      {children}
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const { data: gameTypes } = useGameTypes();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [draftDate, setDraftDate] = useState(() => new Date());
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  // Prefill from whatever's already there (display_name is usually set from Clerk at
  // account-creation time) — the ref guard stops a background refetch from clobbering
  // in-progress input.
  useEffect(() => {
    posthog.capture("onboarding_viewed");
  }, []);

  const hasPrefilled = useRef(false);
  useEffect(() => {
    if (!profile || hasPrefilled.current) return;
    hasPrefilled.current = true;
    setDisplayName(profile.display_name ?? "");
    setDateOfBirth(profile.date_of_birth ?? "");
    setCountryCode(profile.country_code ?? "");
    setInterests(profile.interests ?? []);
  }, [profile]);

  const toggleInterest = (slug: string) =>
    setInterests((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug],
    );

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);
  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [countrySearch]);

  const openDatePicker = () => {
    setDraftDate(parseISODate(dateOfBirth) ?? new Date(2000, 0, 1));
    setShowDatePicker(true);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate) setDateOfBirth(toISODate(selectedDate));
      return;
    }
    if (selectedDate) setDraftDate(selectedDate);
  };

  const confirmIosDate = () => {
    setDateOfBirth(toISODate(draftDate));
    setShowDatePicker(false);
  };

  const closeCountryPicker = () => {
    setShowCountryPicker(false);
    setCountrySearch("");
  };

  const selectCountry = (country: Country) => {
    setCountryCode(country.code);
    closeCountryPicker();
  };

  const canContinue =
    displayName.trim().length > 0 &&
    dateOfBirth.length > 0 &&
    countryCode.length > 0 &&
    interests.length > 0;

  const onContinue = () => {
    if (!canContinue) {
      Alert.alert("Almost there", "Fill in your name, birthday, country, and at least one interest.");
      return;
    }

    updateProfile.mutate(
      {
        display_name: displayName.trim(),
        date_of_birth: dateOfBirth,
        country_code: countryCode.toUpperCase(),
        interests,
      },
      {
        onSuccess: () => router.replace("/(tabs)"),
        onError: (error) => {
          const message =
            error instanceof ApiError
              ? (error.firstValidationError ?? error.message)
              : "Something went wrong. Please try again.";
          Alert.alert("Couldn't save", message);
        },
      },
    );
  };

  // Already finished setup (e.g. navigated here directly) — nothing to do here.
  if (profile && isProfileSetupComplete(profile)) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-foreground text-2xl font-bold tracking-tight">
            Welcome to Yowimo 🎉
          </Text>
          <Text className="mt-1 text-muted-foreground text-sm">
            A few quick things before you dive in.
          </Text>

          {isLoading ? (
            <View className="mt-10 items-center">
              <ActivityIndicator color="#B03BFF" />
            </View>
          ) : (
            <>
              <View className="mt-7 gap-4">
                <Field label="Display name">
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    maxLength={100}
                    placeholder="What should we call you?"
                    placeholderTextColor="#a3a3ab"
                    className="rounded-xl bg-input border border-border px-3.5 py-3 text-foreground text-sm"
                  />
                </Field>

                <Field label="Birthday">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={openDatePicker}
                    className="flex-row items-center justify-between rounded-xl bg-input border border-border px-3.5 py-3"
                  >
                    <Text className={`text-sm ${dateOfBirth ? "text-foreground" : "text-muted-foreground"}`}>
                      {dateOfBirth ? formatDisplayDate(dateOfBirth) : "Select your birthday"}
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
                    <Text className={`text-sm ${selectedCountry ? "text-foreground" : "text-muted-foreground"}`}>
                      {selectedCountry ? `${selectedCountry.name} (${selectedCountry.code})` : "Select your country"}
                    </Text>
                    <ChevronDown color="#a3a3ab" size={16} strokeWidth={2} />
                  </TouchableOpacity>
                </Field>
              </View>

              <View className="mt-7">
                <Text className="mb-1 text-foreground text-base font-semibold">What are you into?</Text>
                <Text className="mb-3 text-muted-foreground text-xs">
                  Pick at least one — powers Discover&apos;s &quot;For you&quot; feed.
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(gameTypes ?? []).map((g) => {
                    const active = interests.includes(g.slug);
                    return (
                      <TouchableOpacity
                        key={g.slug}
                        onPress={() => toggleInterest(g.slug)}
                        activeOpacity={0.8}
                        className={`flex-row items-center gap-1 rounded-full border px-3 py-1.5 ${
                          active ? "border-violet-bright bg-violet/20" : "border-border bg-secondary/40"
                        }`}
                      >
                        {active && <Check color="#fff" size={12} strokeWidth={2.5} />}
                        <Text className={`text-xs font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                          {g.emoji} {g.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                onPress={onContinue}
                activeOpacity={0.85}
                disabled={updateProfile.isPending}
                className="mt-9"
              >
                <LinearGradient
                  colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-14 items-center justify-center rounded-2xl"
                  style={{ opacity: canContinue ? 1 : 0.5 }}
                >
                  {updateProfile.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-white text-base font-semibold">Let&apos;s go</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
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
        <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
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
      <Modal visible={showCountryPicker} transparent animationType="slide" onRequestClose={closeCountryPicker}>
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
                    {item.code === countryCode && <Check color="#B03BFF" size={14} strokeWidth={2.5} />}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text className="text-muted-foreground text-sm text-center py-8">No countries found</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
