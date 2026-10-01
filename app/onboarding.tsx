import InlineRetry from "@/components/shared/InlineRetry";
import { COUNTRIES, type Country } from "@/data/countries";
import { useGameTypes } from "@/hooks/api/useGameTypes";
import { useProfile, useUpdateProfile } from "@/hooks/api/useProfile";
import { ApiError, type GameTypeResource } from "@/lib/api/types";
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

const UNSET_FIELD_CLASS = "text-muted-foreground";
const SET_FIELD_CLASS = "text-foreground";

function toggleInterestValue(current: string[], slug: string): string[] {
  return current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
}

function updateProfileErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Something went wrong. Please try again.";
  return error.firstValidationError ?? error.message;
}

// Bundles the birthday field's own state, modal, and derived display label so the screen that
// renders it doesn't carry any of this branching itself.
function useBirthdayPicker(initialISODate: string) {
  const [dateOfBirth, setDateOfBirth] = useState(initialISODate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [draftDate, setDraftDate] = useState(() => new Date());

  const open = () => {
    setDraftDate(parseISODate(dateOfBirth) ?? new Date(2000, 0, 1));
    setShowDatePicker(true);
  };

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate) setDateOfBirth(toISODate(selectedDate));
      return;
    }
    if (selectedDate) setDraftDate(selectedDate);
  };

  const confirm = () => {
    setDateOfBirth(toISODate(draftDate));
    setShowDatePicker(false);
  };

  return {
    dateOfBirth,
    setDateOfBirth,
    showDatePicker,
    draftDate,
    open,
    onChange,
    confirm,
    close: () => setShowDatePicker(false),
    hasValue: dateOfBirth.length > 0,
    displayLabel: dateOfBirth ? formatDisplayDate(dateOfBirth) : "Select your birthday",
    labelClassName: dateOfBirth ? SET_FIELD_CLASS : UNSET_FIELD_CLASS,
  };
}

// Same idea as useBirthdayPicker, for the country field + its search modal.
function useCountryPicker(initialCode: string) {
  const [countryCode, setCountryCode] = useState(initialCode);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [countrySearch]);

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);

  const close = () => {
    setShowCountryPicker(false);
    setCountrySearch("");
  };

  const select = (country: Country) => {
    setCountryCode(country.code);
    close();
  };

  return {
    countryCode,
    setCountryCode,
    showCountryPicker,
    open: () => setShowCountryPicker(true),
    close,
    select,
    countrySearch,
    setCountrySearch,
    filteredCountries,
    hasValue: Boolean(selectedCountry),
    displayLabel: selectedCountry ? `${selectedCountry.name} (${selectedCountry.code})` : "Select your country",
    labelClassName: selectedCountry ? SET_FIELD_CLASS : UNSET_FIELD_CLASS,
  };
}

function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <View className="gap-1.5">
      <Text className="text-muted-foreground text-xs font-semibold">{label}</Text>
      {children}
    </View>
  );
}

function InterestsPicker({
  isLoading,
  isError,
  gameTypes,
  interests,
  onRetry,
  onToggle,
}: Readonly<{
  isLoading: boolean;
  isError: boolean;
  gameTypes: GameTypeResource[];
  interests: string[];
  onRetry: () => void;
  onToggle: (slug: string) => void;
}>) {
  if (isLoading) {
    return <ActivityIndicator color="#B03BFF" style={{ marginVertical: 16 }} />;
  }

  if (isError) {
    return <InlineRetry message="Couldn't load interests." onRetry={onRetry} />;
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {gameTypes.map((g) => {
        const active = interests.includes(g.slug);
        return (
          <TouchableOpacity
            key={g.slug}
            onPress={() => onToggle(g.slug)}
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
  );
}

function BirthdayPickerModal({
  visible,
  draftDate,
  onChange,
  onConfirm,
  onClose,
}: Readonly<{
  visible: boolean;
  draftDate: Date;
  onChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onConfirm: () => void;
  onClose: () => void;
}>) {
  if (Platform.OS === "android") {
    if (!visible) return null;
    return (
      <DateTimePicker
        value={draftDate}
        mode="date"
        display="default"
        maximumDate={new Date()}
        onChange={onChange}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View className="bg-card rounded-t-3xl px-6 pt-6 pb-10">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-muted-foreground text-sm font-semibold">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-foreground text-base font-bold">Birthday</Text>
            <TouchableOpacity onPress={onConfirm}>
              <Text className="text-violet-bright text-sm font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={draftDate}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={onChange}
            textColor="#ffffff"
            style={{ height: 200 }}
          />
        </View>
      </View>
    </Modal>
  );
}

function CountryPickerModal({
  visible,
  search,
  onSearchChange,
  countries,
  selectedCode,
  onSelect,
  onClose,
}: Readonly<{
  visible: boolean;
  search: string;
  onSearchChange: (text: string) => void;
  countries: Country[];
  selectedCode: string;
  onSelect: (country: Country) => void;
  onClose: () => void;
}>) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          activeOpacity={1}
          onPress={onClose}
        />
        {/* Without KeyboardAvoidingView here, the keyboard (once its open animation finishes,
         * a beat after the first keystroke) covers most of this 75%-height sheet — the list
         * looked like it "disappeared" because it was still there, just hidden behind the
         * keyboard. This shifts the whole sheet up instead. */}
        <View className="bg-card rounded-t-3xl px-6 pt-6 pb-6" style={{ maxHeight: "75%" }}>
          <Text className="text-foreground text-lg font-bold mb-4">Select country</Text>

          <View className="flex-row items-center rounded-xl bg-input border border-border px-3.5 mb-3">
            <Search color="#a3a3ab" size={16} strokeWidth={2} />
            <TextInput
              className="flex-1 py-3 pl-2 text-foreground text-sm"
              value={search}
              onChangeText={onSearchChange}
              placeholder="Search countries"
              placeholderTextColor="#a3a3ab"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={countries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onSelect(item)}
                className="flex-row items-center justify-between py-3"
                style={{ borderBottomWidth: 1, borderBottomColor: "#2e2e38" }}
              >
                <Text className="text-foreground text-sm">{item.name}</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-muted-foreground text-xs">{item.code}</Text>
                  {item.code === selectedCode && <Check color="#B03BFF" size={14} strokeWidth={2.5} />}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text className="text-muted-foreground text-sm text-center py-8">No countries found</Text>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const {
    data: gameTypes,
    isLoading: isGamesLoading,
    isError: isGamesError,
    refetch: refetchGameTypes,
  } = useGameTypes();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const birthday = useBirthdayPicker("");
  const country = useCountryPicker("");

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
    birthday.setDateOfBirth(profile.date_of_birth ?? "");
    country.setCountryCode(profile.country_code ?? "");
    setInterests(profile.interests ?? []);
    // Only ever runs once, the first time `profile` arrives — re-running on every identity
    // change of these setters (stable, but not memoized across the hooks) isn't the intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const toggleInterest = (slug: string) =>
    setInterests((current) => toggleInterestValue(current, slug));

  const canContinue =
    displayName.trim().length > 0 && birthday.hasValue && country.hasValue && interests.length > 0;

  const onContinue = () => {
    if (!canContinue) {
      Alert.alert("Almost there", "Fill in your name, birthday, country, and at least one interest.");
      return;
    }

    updateProfile.mutate(
      {
        display_name: displayName.trim(),
        date_of_birth: birthday.dateOfBirth,
        country_code: country.countryCode.toUpperCase(),
        interests,
      },
      {
        onSuccess: () => router.replace("/(tabs)"),
        onError: (error) => Alert.alert("Couldn't save", updateProfileErrorMessage(error)),
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
                    onPress={birthday.open}
                    className="flex-row items-center justify-between rounded-xl bg-input border border-border px-3.5 py-3"
                  >
                    <Text className={`text-sm ${birthday.labelClassName}`}>{birthday.displayLabel}</Text>
                    <Calendar color="#a3a3ab" size={16} strokeWidth={2} />
                  </TouchableOpacity>
                </Field>

                <Field label="Country">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={country.open}
                    className="flex-row items-center justify-between rounded-xl bg-input border border-border px-3.5 py-3"
                  >
                    <Text className={`text-sm ${country.labelClassName}`}>{country.displayLabel}</Text>
                    <ChevronDown color="#a3a3ab" size={16} strokeWidth={2} />
                  </TouchableOpacity>
                </Field>
              </View>

              <View className="mt-7">
                <Text className="mb-1 text-foreground text-base font-semibold">What are you into?</Text>
                <Text className="mb-3 text-muted-foreground text-xs">
                  Pick at least one — powers Discover&apos;s &quot;For you&quot; feed.
                </Text>
                <InterestsPicker
                  isLoading={isGamesLoading}
                  isError={isGamesError}
                  gameTypes={gameTypes ?? []}
                  interests={interests}
                  onRetry={() => refetchGameTypes()}
                  onToggle={toggleInterest}
                />
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
                  className="h-14 flex-row items-center justify-center gap-2 rounded-2xl"
                  style={{ opacity: canContinue ? 1 : 0.5 }}
                >
                  {updateProfile.isPending ? (
                    <>
                      <ActivityIndicator color="#fff" size="small" />
                      {/* A paused mutation (queryClient's onlineManager holding it for real
                       * connectivity) looks identical to a hang without this — same signal
                       * NetworkStatusGate uses, surfaced here too since that modal only covers
                       * a fully-offline device, not "connected but no real route" (the actual
                       * state seen during testing — PostHog's own fetches were failing too). */}
                      {updateProfile.isPaused && (
                        <Text className="text-white text-sm font-semibold">Waiting for connection…</Text>
                      )}
                    </>
                  ) : (
                    <Text className="text-white text-base font-semibold">Let&apos;s go</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <BirthdayPickerModal
        visible={birthday.showDatePicker}
        draftDate={birthday.draftDate}
        onChange={birthday.onChange}
        onConfirm={birthday.confirm}
        onClose={birthday.close}
      />

      <CountryPickerModal
        visible={country.showCountryPicker}
        search={country.countrySearch}
        onSearchChange={country.setCountrySearch}
        countries={country.filteredCountries}
        selectedCode={country.countryCode}
        onSelect={country.select}
        onClose={country.close}
      />
    </SafeAreaView>
  );
}
