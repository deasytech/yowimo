import Toast from "@/components/shared/Toast";
import { useGameTypes } from "@/hooks/api/useGameTypes";
import { useCreateParty } from "@/hooks/api/useParties";
import { useToast } from "@/hooks/useToast";
import { ApiError, CreatePartyPayload, LocalImageFile, PartyMode } from "@/lib/api/types";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  Camera,
  CheckCircle2,
  Globe,
  Lock,
  Minus,
  Plus,
  Sparkles,
  Tv,
  Users,
  X,
} from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const GRID_PADDING = 20; // matches contentContainerStyle paddingHorizontal
const GRID_GAP = 12; // matches gap-3
const GRID_COLUMNS = 3;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 200;
const DEFAULT_PLAYERS = 8;

const MODES: { id: PartyMode; label: string; Icon: typeof Globe }[] = [
  { id: "online", label: "Online", Icon: Globe },
  { id: "in_person", label: "In-person", Icon: Users },
  { id: "hybrid", label: "Hybrid", Icon: Tv },
];

export default function CreatePartyScreen() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId?: string }>();
  const { width: windowWidth } = useWindowDimensions();
  const { data: gameTypes, isLoading, isError, error, refetch } = useGameTypes();
  const createParty = useCreateParty();

  const [game, setGame] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState<LocalImageFile | null>(null);
  const [mode, setMode] = useState<PartyMode>("online");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [maxPlayers, setMaxPlayers] = useState(DEFAULT_PLAYERS);
  const [maxPlayersDraft, setMaxPlayersDraft] = useState(String(DEFAULT_PLAYERS));
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [draftDate, setDraftDate] = useState(() => new Date());
  const [scheduledModalVisible, setScheduledModalVisible] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);

  const [toastMessage, setToastMessage] = useState("");
  const [toastBg, setToastBg] = useState("bg-green-600");
  const toast = useToast();

  const [gridWidth, setGridWidth] = useState(windowWidth - GRID_PADDING * 2);

  const selected = gameTypes?.find((g) => g.id === game) ?? gameTypes?.[0];

  useEffect(() => {
    if (!gameTypes?.length) return;

    const requestedGame = gameTypes.find((item) => String(item.id) === gameId);

    if (requestedGame) {
      setGame(requestedGame.id);
    } else {
      setGame((current) => current ?? gameTypes[0].id);
    }
  }, [gameId, gameTypes]);
  // Round down so three cards plus both gaps can never overflow and wrap.
  const cardSize = Math.floor(
    (gridWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS,
  );

  const notify = (message: string, variant: "success" | "error") => {
    setToastMessage(message);
    setToastBg(variant === "success" ? "bg-green-600" : "bg-red-600");
    toast.showToast();
  };

  const needsLocation = mode === "in_person" || mode === "hybrid";

  const clampPlayers = (value: number) => Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, value));

  const commitMaxPlayers = (value: number) => {
    const clamped = clampPlayers(value);
    setMaxPlayers(clamped);
    setMaxPlayersDraft(String(clamped));
  };

  const stepMaxPlayers = (delta: number) => commitMaxPlayers(maxPlayers + delta);

  // The draft can hold a value the user just typed but hasn't blurred/submitted yet — resolve
  // from it directly rather than the last-committed `maxPlayers`, so a fast tap straight from
  // the field to a submit button doesn't silently drop what's on screen.
  const resolveMaxPlayers = () => {
    const parsed = parseInt(maxPlayersDraft, 10);
    return Number.isFinite(parsed) ? clampPlayers(parsed) : maxPlayers;
  };

  const onMaxPlayersChangeText = (text: string) => {
    setMaxPlayersDraft(text.replace(/[^0-9]/g, "").slice(0, 3));
  };

  const onMaxPlayersBlur = () => commitMaxPlayers(resolveMaxPlayers());

  const pickCoverImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notify("Allow photo access to set a cover image", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const extension = asset.uri.split(".").pop()?.toLowerCase() ?? "jpg";
    const type = asset.mimeType ?? (extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg");
    setCoverImage({ uri: asset.uri, name: asset.fileName ?? `cover.${extension}`, type });
  };

  const buildPayload = (saveAsDraft: boolean): CreatePartyPayload | null => {
    if (!title.trim()) {
      notify("Give your party a title first", "error");
      return null;
    }
    if (needsLocation && !venueName.trim()) {
      notify("Add a venue for an in-person or hybrid party", "error");
      return null;
    }

    return {
      title: title.trim(),
      game_type_id: selected?.id ?? null,
      mode,
      visibility,
      max_players: resolveMaxPlayers(),
      starts_at: isScheduled && startsAt ? startsAt.toISOString() : null,
      save_as_draft: saveAsDraft,
      location: needsLocation
        ? { venue_name: venueName.trim(), address: address.trim() || undefined }
        : undefined,
      cover_image: coverImage,
    };
  };

  const handleCreate = async (saveAsDraft: boolean) => {
    if (createParty.isPending) return;
    const payload = buildPayload(saveAsDraft);
    if (!payload) return;

    try {
      const party = await createParty.mutateAsync(payload);
      // A scheduled party isn't ready to host yet — landing in its lobby would surface a
      // "Start party" action that doesn't make sense until closer to starts_at, so confirm
      // and send the host home instead of into the lobby.
      if (!saveAsDraft && isScheduled && startsAt) {
        setScheduledFor(startsAt);
        setScheduledModalVisible(true);
        return;
      }
      router.replace(`/lobby/${party.id}`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't create the party — please try again", "error");
    }
  };

  const dismissScheduledModal = () => {
    setScheduledModalVisible(false);
    router.replace("/");
  };

  const openDatePicker = () => {
    setDraftDate(startsAt ?? new Date(Date.now() + 60 * 60 * 1000));
    setShowDatePicker(true);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate) {
        setStartsAt(selectedDate);
        setIsScheduled(true);
      }
      return;
    }
    if (selectedDate) setDraftDate(selectedDate);
  };

  const confirmIosDate = () => {
    setStartsAt(draftDate);
    setIsScheduled(true);
    setShowDatePicker(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Toast
        opacity={toast.opacity}
        isVisible={toast.isVisible}
        message={toastMessage}
        bgClass={toastBg}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-foreground text-3xl font-bold tracking-tight mt-16">
          Create a party
        </Text>
        <Text className="mt-1 text-muted-foreground text-sm">
          Pick the game. Set the vibe. Send it.
        </Text>

        {isLoading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color="#B03BFF" />
          </View>
        ) : !selected || !gameTypes?.length ? (
          <View className="mt-10 items-center gap-3">
            <Text className="text-muted-foreground text-sm">Couldn&apos;t load games.</Text>
            {isError && (
              <Text className="text-muted-foreground/70 text-xs text-center px-6">
                {error instanceof Error ? error.message : "Unknown error"}
              </Text>
            )}
            <TouchableOpacity onPress={() => refetch()} activeOpacity={0.8}>
              <Text className="text-violet-bright text-sm font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* A refetch (e.g. pull-to-refresh elsewhere) failed, but we still have a
                usable cached list — warn without blocking the picker. */}
            {isError && (
              <View className="mt-4 flex-row items-center justify-between rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5">
                <Text className="flex-1 text-muted-foreground text-xs pr-2">
                  Couldn&apos;t refresh games. Showing the last loaded list.
                </Text>
                <TouchableOpacity onPress={() => refetch()} activeOpacity={0.8}>
                  <Text className="text-violet-bright text-xs font-semibold">Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Title ── */}
            <View className="mt-6 gap-1.5">
              <Text className="text-foreground text-base font-semibold">
                Party title
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                placeholder="Friday night chaos"
                placeholderTextColor="#a3a3ab"
                className="rounded-xl bg-input border border-border px-3.5 py-3 text-foreground text-sm"
              />
            </View>

            {/* ── Cover image ── */}
            <View className="mt-6 gap-1.5">
              <Text className="text-foreground text-base font-semibold">
                Cover image
              </Text>
              <Text className="text-muted-foreground text-xs">
                Optional. Shown in Discover instead of the default game art.
              </Text>

              {coverImage ? (
                <View className="mt-1.5 overflow-hidden rounded-2xl" style={{ aspectRatio: 16 / 9 }}>
                  <Image
                    source={{ uri: coverImage.uri }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setCoverImage(null)}
                    activeOpacity={0.8}
                    className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-ink/70"
                  >
                    <X color="#fff" size={16} strokeWidth={2.5} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={pickCoverImage}
                    activeOpacity={0.8}
                    className="absolute bottom-2 right-2 flex-row items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5"
                  >
                    <Camera color="#fff" size={14} strokeWidth={2} />
                    <Text className="text-white text-xs font-semibold">Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={pickCoverImage}
                  activeOpacity={0.8}
                  className="mt-1.5 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/40 py-6"
                >
                  <Camera color="#fff" size={18} strokeWidth={2} />
                  <Text className="text-foreground text-sm font-semibold">
                    Add a cover photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Game picker ── */}
            <View className="mt-6">
              <Text className="mb-3 text-foreground text-base font-semibold">
                Choose your game
              </Text>

              <View
                className="flex-row flex-wrap gap-3"
                onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
              >
                {gameTypes.map((g) => {
                  const active = g.id === game;

                  return (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => setGame(g.id)}
                      activeOpacity={0.85}
                      style={{
                        width: cardSize,
                        height: cardSize,
                        borderRadius: 16,
                        overflow: "hidden",
                        opacity: active ? 1 : 0.8,
                        transform: active ? [{ scale: 1.03 }] : undefined,
                        borderWidth: active ? 2 : 0,
                        borderColor: "#fff",
                      }}
                    >
                      {g.image_url ? (
                        <Image
                          source={{ uri: g.image_url }}
                          style={{ width: cardSize, height: cardSize }}
                          contentFit="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={g.gradient}
                          style={{ width: cardSize, height: cardSize }}
                        />
                      )}

                      {/* Bottom scrim for legible label text over the photo */}
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.20)", "rgba(0,0,0,0.70)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{ position: "absolute", width: "100%", height: "100%" }}
                      />

                      <Text style={{ position: "absolute", top: 8, left: 8, fontSize: 22 }}>
                        {g.emoji}
                      </Text>

                      <Text
                        className="absolute text-white text-[10px] font-bold leading-tight"
                        style={{ left: 8, right: 8, bottom: 8 }}
                        numberOfLines={2}
                      >
                        {g.name}
                      </Text>

                      {g.cost > 0 && (
                        <View
                          className="absolute rounded-full bg-ink/60 px-1.5 py-0.5"
                          style={{ top: 6, right: 6 }}
                        >
                          <Text className="text-white text-[9px] font-bold">
                            🪙{g.cost}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Selected detail ── */}
            <View
              className="relative mt-5 rounded-3xl overflow-hidden"
              style={{ width: "100%", aspectRatio: 16 / 9, alignSelf: "stretch" }}
            >
              <View style={{ flex: 1, backgroundColor: "#19191F" }}>
                {selected.image_url ? (
                  <>
                    <Image
                      key={selected.id}
                      source={{ uri: selected.image_url }}
                      style={{ position: "absolute", width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={["rgba(0,0,0,0.10)", "rgba(0,0,0,0.30)", "rgba(0,0,0,0.75)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={{ position: "absolute", width: "100%", height: "100%" }}
                    />
                  </>
                ) : (
                  <LinearGradient
                    key={selected.id}
                    colors={selected.gradient}
                    style={{ position: "absolute", width: "100%", height: "100%" }}
                  />
                )}

                <View
                  className="flex-row items-end justify-between p-5"
                  style={{ position: "absolute", width: "100%", height: "100%" }}
                >
                  <View className="flex-1 pr-3">
                    <Text style={{ fontSize: 36 }}>{selected.emoji}</Text>
                    <Text className="mt-2 text-white text-xl font-bold">
                      {selected.name}
                    </Text>
                    <Text className="text-white/85 text-sm">{selected.tagline}</Text>
                  </View>

                  <View className="rounded-full bg-ink/50 px-3 py-1">
                    <Text className="text-white text-xs font-bold">
                      {capitalize(selected.intensity)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Mode ── */}
            <View className="mt-6">
              <Text className="mb-3 text-foreground text-base font-semibold">
                How will you play?
              </Text>

              <View className="flex-row gap-2">
                {MODES.map((m) => {
                  const active = mode === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setMode(m.id)}
                      activeOpacity={0.85}
                      style={{ flex: 1 }}
                      className={`items-center gap-1.5 rounded-2xl border p-3 ${active
                        ? "border-violet-bright bg-violet/15"
                        : "border-border bg-secondary/40"
                        }`}
                    >
                      <m.Icon color="#fff" size={20} strokeWidth={2} />
                      <Text className="text-foreground text-xs font-semibold">{m.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Location (hybrid / in-person only) ── */}
            {needsLocation && (
              <View className="mt-6 gap-3">
                <Text className="text-foreground text-base font-semibold">
                  Where&apos;s it happening?
                </Text>
                <TextInput
                  value={venueName}
                  onChangeText={setVenueName}
                  maxLength={100}
                  placeholder="Venue name"
                  placeholderTextColor="#a3a3ab"
                  className="rounded-xl bg-input border border-border px-3.5 py-3 text-foreground text-sm"
                />
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  maxLength={200}
                  placeholder="Address (optional)"
                  placeholderTextColor="#a3a3ab"
                  className="rounded-xl bg-input border border-border px-3.5 py-3 text-foreground text-sm"
                />
              </View>
            )}

            {/* ── Players ── */}
            <View className="mt-6">
              <Text className="mb-3 text-foreground text-base font-semibold">
                Max players
              </Text>
              <View className="flex-row items-center justify-between rounded-2xl border border-border bg-secondary/40 p-3">
                <TouchableOpacity
                  onPress={() => stepMaxPlayers(-1)}
                  activeOpacity={0.8}
                  className="h-10 w-10 items-center justify-center rounded-full bg-secondary"
                >
                  <Minus color="#fff" size={16} strokeWidth={2.5} />
                </TouchableOpacity>
                <TextInput
                  value={maxPlayersDraft}
                  onChangeText={onMaxPlayersChangeText}
                  onBlur={onMaxPlayersBlur}
                  onSubmitEditing={onMaxPlayersBlur}
                  keyboardType="number-pad"
                  maxLength={3}
                  selectTextOnFocus
                  className="text-foreground text-lg font-bold"
                  // textAlign is set via `style`, not `className` — this preview build of
                  // react-native-css/nativewind crashes ("path.split is not a function")
                  // resolving `textAlign` through its TextInput nativeStyleMapping when it
                  // comes from a class like `text-center` instead.
                  style={{ minWidth: 48, textAlign: "center" }}
                />
                <TouchableOpacity
                  onPress={() => stepMaxPlayers(1)}
                  activeOpacity={0.8}
                  className="h-10 w-10 items-center justify-center rounded-full bg-secondary"
                >
                  <Plus color="#fff" size={16} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              <Text className="mt-1.5 text-muted-foreground text-[11px] text-center">
                {MIN_PLAYERS}–{MAX_PLAYERS} players
              </Text>
            </View>

            {/* ── Schedule ── */}
            <View className="mt-6">
              <Text className="mb-3 text-foreground text-base font-semibold">
                When?
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setIsScheduled(false)}
                  activeOpacity={0.85}
                  style={{ flex: 1 }}
                  className={`items-center rounded-2xl border p-3.5 ${!isScheduled
                    ? "border-violet-bright bg-violet/15"
                    : "border-border bg-secondary/40"
                    }`}
                >
                  <Text className="text-foreground text-sm font-semibold">Right now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={openDatePicker}
                  activeOpacity={0.85}
                  style={{ flex: 1.4 }}
                  className={`flex-row items-center justify-center gap-1.5 rounded-2xl border p-3.5 ${isScheduled
                    ? "border-violet-bright bg-violet/15"
                    : "border-border bg-secondary/40"
                    }`}
                >
                  <Calendar color="#fff" size={16} strokeWidth={2} />
                  <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                    {isScheduled && startsAt
                      ? startsAt.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                      : "Schedule for later"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Visibility ── */}
            <View className="mt-6">
              <Text className="mb-3 text-foreground text-base font-semibold">
                {"Who's invited?"}
              </Text>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setVisibility("private")}
                  activeOpacity={0.85}
                  style={{ flex: 1 }}
                  className={`flex-row items-center gap-2 rounded-2xl border p-4 ${visibility === "private"
                    ? "border-violet-bright bg-violet/15"
                    : "border-border bg-secondary/40"
                    }`}
                >
                  <Lock color="#fff" size={16} strokeWidth={2} />
                  <View>
                    <Text className="text-foreground text-sm font-semibold">Private</Text>
                    <Text className="text-muted-foreground text-[11px]">Invite only</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setVisibility("public")}
                  activeOpacity={0.85}
                  style={{ flex: 1 }}
                  className={`flex-row items-center gap-2 rounded-2xl border p-4 ${visibility === "public"
                    ? "border-violet-bright bg-violet/15"
                    : "border-border bg-secondary/40"
                    }`}
                >
                  <Globe color="#fff" size={16} strokeWidth={2} />
                  <View>
                    <Text className="text-foreground text-sm font-semibold">Public</Text>
                    <Text className="text-muted-foreground text-[11px]">In Discover</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── AI assist ── */}
            <View className="mt-6 rounded-3xl border border-border bg-card p-4">
              <View className="flex-row items-center gap-2">
                <LinearGradient
                  colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-9 w-9 items-center justify-center rounded-full"
                >
                  <Sparkles color="#fff" size={16} strokeWidth={2} />
                </LinearGradient>

                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">
                    AI Host enabled
                  </Text>
                  <Text className="text-muted-foreground text-[11px]">
                    Custom challenges, MVPs, and a recap at the end.
                  </Text>
                </View>

                <Text className="text-violet-bright text-xs font-bold">FREE</Text>
              </View>
            </View>

            {/* ── Actions ── */}
            <View className="mt-8 flex-row gap-3">
              <TouchableOpacity
                onPress={() => handleCreate(true)}
                activeOpacity={0.8}
                disabled={createParty.isPending}
                style={{ flex: 1 }}
                className="h-14 items-center justify-center rounded-2xl border border-border"
              >
                <Text className="text-foreground text-sm font-semibold">Save draft</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleCreate(false)}
                activeOpacity={0.85}
                disabled={createParty.isPending}
                style={{ flex: 1.4 }}
              >
                <LinearGradient
                  colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-14 items-center justify-center rounded-2xl"
                  style={{ opacity: createParty.isPending ? 0.7 : 1 }}
                >
                  {createParty.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-white text-sm font-semibold">
                      {isScheduled ? "Schedule party" : "Launch party"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Start date/time picker ── */}
      {Platform.OS === "android" ? (
        showDatePicker && (
          <DateTimePicker
            value={draftDate}
            mode="datetime"
            display="default"
            minimumDate={new Date()}
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
                <Text className="text-foreground text-base font-bold">Starts at</Text>
                <TouchableOpacity onPress={confirmIosDate}>
                  <Text className="text-violet-bright text-sm font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={draftDate}
                mode="datetime"
                display="spinner"
                minimumDate={new Date()}
                onChange={onDateChange}
                textColor="#ffffff"
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* ── Scheduled confirmation ── */}
      <Modal
        visible={scheduledModalVisible}
        transparent
        animationType="fade"
        onRequestClose={dismissScheduledModal}
      >
        <View
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          className="items-center justify-center px-8"
        >
          <View className="w-full items-center rounded-3xl border border-border bg-card p-6">
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-14 w-14 items-center justify-center rounded-full"
            >
              <CheckCircle2 color="#fff" size={28} strokeWidth={2} />
            </LinearGradient>

            <Text className="mt-4 text-foreground text-lg font-bold text-center">
              Party scheduled!
            </Text>
            <Text className="mt-2 text-muted-foreground text-sm text-center leading-relaxed">
              {scheduledFor
                ? `It kicks off ${scheduledFor.toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}. `
                : ""}
              We&apos;ll count you down and notify you via WhatsApp and push notification
              starting 7 days out.
            </Text>

            <TouchableOpacity
              onPress={dismissScheduledModal}
              activeOpacity={0.85}
              style={{ width: "100%" }}
              className="mt-6"
            >
              <LinearGradient
                colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-12 w-full items-center justify-center rounded-2xl"
              >
                <Text className="text-white text-sm font-semibold">Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
