import Toast from "@/components/shared/Toast";
import { useChat } from "@/context/ChatContext";
import { basePartyId, PARTIES } from "@/data/mock";
import { useToast } from "@/hooks/useToast";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Link, router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Ban,
  Flag,
  Mic,
  Pause,
  Play,
  Send,
  Smile,
} from "lucide-react-native";
import { styled } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

const AVATAR_GRADIENTS: readonly (readonly [string, string])[] = [
  ["#7A1EFF", "#D84CFF"],
  ["#D84CFF", "#FF8A2A"],
  ["#FF8A2A", "#7A1EFF"],
  ["#7A1EFF", "#B03BFF"],
];

const EMOJIS = [
  "😀", "😂", "😍", "😮", "😢", "😡", "👍", "👎",
  "🔥", "🎉", "💯", "🙌", "👏", "😭", "🥳", "😱",
  "💀", "❤️", "✨", "🤔", "😴", "🍻", "🎮", "🚀",
];

const WAVE_HEIGHTS = [6, 12, 8, 16, 10, 14, 7, 11];

const formatDuration = (totalSeconds: number) => {
  const safe = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

function VoiceBubble({
  uri,
  durationMs,
  mine,
}: {
  uri: string;
  durationMs: number;
  mine?: boolean;
}) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const totalSeconds = status.duration || durationMs / 1000;
  const remaining = Math.max(0, totalSeconds - status.currentTime);

  const toggle = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish) player.seekTo(0);
    player.play();
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.85}
      className="flex-row items-center gap-2.5 py-0.5 pr-1"
    >
      <View
        className={`h-8 w-8 items-center justify-center rounded-full ${mine ? "bg-white/25" : "bg-primary"
          }`}
      >
        {status.playing ? (
          <Pause color="#fff" size={14} strokeWidth={2.5} />
        ) : (
          <Play color="#fff" size={14} strokeWidth={2.5} fill="#fff" />
        )}
      </View>
      <View className="flex-row items-end gap-0.5">
        {WAVE_HEIGHTS.map((h, i) => (
          <View
            key={i}
            className={`w-1 rounded-full ${mine ? "bg-white/70" : "bg-magenta/80"}`}
            style={{ height: h }}
          />
        ))}
      </View>
      <Text className={`text-xs font-semibold ${mine ? "text-white/90" : "text-foreground"}`}>
        {formatDuration(status.playing ? remaining : totalSeconds)}
      </Text>
    </TouchableOpacity>
  );
}

export default function PartyChatScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const chatPartyId = slug ? basePartyId(slug) : "";
  const party = PARTIES.find((p) => p.id === chatPartyId);

  const { getMessages, sendMessage, sendVoiceNote, enterChat, leaveChat, blockUser } =
    useChat();
  const messages = party ? getMessages(party.id) : [];

  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sheetUser, setSheetUser] = useState<{ who: string; initials: string } | null>(null);
  const listRef = useRef<FlatList>(null);

  const [toastMessage, setToastMessage] = useState("");
  const [toastBg, setToastBg] = useState("bg-green-600");
  const toast = useToast();
  const notify = (message: string) => {
    setToastMessage(message);
    setToastBg("bg-green-600");
    toast.showToast();
  };

  useEffect(() => {
    if (!party) return;
    enterChat(party.id);
    return () => leaveChat();
  }, [party?.id]);

  // ── Voice notes ──────────────────────────────────────────────────────────
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  useAudioRecorderState(recorder);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioModeReadyRef = useRef(false);
  const cancelStartRef = useRef(false);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  const startRecording = async () => {
    cancelStartRef.current = false;
    try {
      if (!audioModeReadyRef.current) {
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) {
          Alert.alert(
            "Microphone access needed",
            "Enable microphone access in Settings to send voice notes."
          );
          return;
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        audioModeReadyRef.current = true;
      }
      await recorder.prepareToRecordAsync();
      if (cancelStartRef.current) {
        cancelStartRef.current = false;
        return;
      }
      recorder.record();
      setRecordSeconds(0);
      setIsRecording(true);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      Alert.alert("Couldn't start recording", "Please try again.");
    }
  };

  const stopRecording = async () => {
    cancelStartRef.current = true;
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (!isRecording) return;
    setIsRecording(false);
    try {
      await recorder.stop();
      if (recorder.uri && recordSeconds > 0 && party) {
        sendVoiceNote(party.id, recorder.uri, recordSeconds * 1000);
        requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
      }
    } catch {
      // Recording may already be stopped — nothing to send.
    }
  };

  // ── Text + emoji ─────────────────────────────────────────────────────────
  const handleSendText = () => {
    if (!draft.trim() || !party) return;
    sendMessage(party.id, draft.trim());
    setDraft("");
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const handleSendEmoji = (emoji: string) => {
    if (!party) return;
    sendMessage(party.id, emoji);
    setEmojiOpen(false);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  // ── Report / block ───────────────────────────────────────────────────────
  const openUserSheet = (who: string, initials: string) => {
    if (who === "You") return;
    setSheetUser({ who, initials });
  };
  const closeUserSheet = () => setSheetUser(null);

  const confirmReport = () => {
    if (!sheetUser) return;
    const { who } = sheetUser;
    closeUserSheet();
    Alert.alert(
      `Report ${who}?`,
      "We'll review this conversation. They won't be notified.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Report", style: "destructive", onPress: () => notify(`${who} was reported`) },
      ]
    );
  };

  const confirmBlock = () => {
    if (!sheetUser) return;
    const { who } = sheetUser;
    closeUserSheet();
    Alert.alert(
      `Block ${who}?`,
      `You won't see messages from ${who} anymore.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            blockUser(who);
            notify(`${who} was blocked`);
          },
        },
      ]
    );
  };

  if (!party) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-foreground text-lg font-bold text-center">
          This party chat isn&apos;t available anymore.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          className="mt-4 rounded-full bg-white/10 border border-white/10 px-5 py-2.5"
        >
          <Text className="text-white text-sm font-semibold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <Toast opacity={toast.opacity} isVisible={toast.isVisible} message={toastMessage} bgClass={toastBg} />

      {/* Header */}
      <View className="flex-row items-center gap-3 px-5 py-3 border-b border-white/10">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          className="h-10 w-10 items-center justify-center rounded-full bg-card border border-border"
        >
          <ArrowLeft color="#fff" size={16} strokeWidth={2} />
        </TouchableOpacity>

        <Link href={`/lobby/${party.id}`} asChild>
          <TouchableOpacity activeOpacity={0.85} className="flex-1 flex-row items-center gap-3">
            <LinearGradient
              colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-10 w-10 items-center justify-center rounded-full"
            >
              <Text className="text-white text-xs font-bold">{party.hostAvatar}</Text>
            </LinearGradient>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-foreground text-sm font-bold">
                {party.title}
              </Text>
              <Text numberOfLines={1} className="text-muted-foreground text-xs">
                {party.isLive ? `🔴 Live · ${party.players} in chat` : `${party.players} in chat`}
              </Text>
            </View>
          </TouchableOpacity>
        </Link>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}
          renderItem={({ item, index }) => {
            if (item.mine) {
              return (
                <View className="flex-row justify-end">
                  <LinearGradient
                    colors={["#7A1EFF", "#D84CFF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2.5"
                  >
                    {item.audioUri ? (
                      <VoiceBubble uri={item.audioUri} durationMs={item.audioDurationMs ?? 0} mine />
                    ) : (
                      <Text className="text-white text-sm">{item.text}</Text>
                    )}
                  </LinearGradient>
                </View>
              );
            }
            const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openUserSheet(item.who, item.initials)}
                className="flex-row items-start gap-2.5"
              >
                <LinearGradient
                  colors={gradient}
                  className="h-8 w-8 items-center justify-center rounded-full"
                >
                  <Text className="text-white text-[11px] font-bold">{item.initials}</Text>
                </LinearGradient>
                <View className="flex-1 max-w-[80%] rounded-2xl rounded-tl-sm bg-card px-4 py-2.5">
                  <Text className="text-magenta text-xs font-semibold">{item.who}</Text>
                  {item.audioUri ? (
                    <View className="mt-0.5">
                      <VoiceBubble uri={item.audioUri} durationMs={item.audioDurationMs ?? 0} />
                    </View>
                  ) : (
                    <Text className="mt-0.5 text-foreground text-sm">{item.text}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Emoji picker */}
        {emojiOpen && (
          <View className="px-5 pb-2">
            <View className="flex-row flex-wrap gap-2 rounded-2xl border border-white/10 bg-card p-3">
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  onPress={() => handleSendEmoji(e)}
                  activeOpacity={0.7}
                  className="h-10 w-10 items-center justify-center rounded-xl bg-white/5"
                >
                  <Text className="text-xl">{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Composer */}
        <View className="flex-row items-center gap-2 px-5 py-3 border-t border-white/10">
          <TouchableOpacity
            onPress={() => setEmojiOpen((v) => !v)}
            activeOpacity={0.8}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/10"
          >
            <Smile color="rgba(255,255,255,0.80)" size={18} strokeWidth={2} />
          </TouchableOpacity>

          <View className="flex-1 h-11 rounded-full bg-white/10 border border-white/10 px-4 flex-row items-center">
            {isRecording ? (
              <View className="flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-red-500" />
                <Text className="text-white text-sm">Recording… {formatDuration(recordSeconds)}</Text>
              </View>
            ) : (
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Say something…"
                placeholderTextColor="rgba(255,255,255,0.40)"
                className="flex-1 text-white text-sm"
                multiline
                onSubmitEditing={handleSendText}
              />
            )}
          </View>

          {draft.trim() ? (
            <TouchableOpacity onPress={handleSendText} activeOpacity={0.85}>
              <LinearGradient
                colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-10 w-10 items-center justify-center rounded-full"
              >
                <Send color="#fff" size={16} strokeWidth={2} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <Pressable onPressIn={startRecording} onPressOut={stopRecording}>
              {({ pressed }) => (
                <View
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: pressed || isRecording ? "#EF4444" : "rgba(255,255,255,0.15)",
                  }}
                >
                  <Mic color="#fff" size={18} strokeWidth={2} />
                </View>
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Report / block bottom sheet */}
      <Modal visible={!!sheetUser} transparent animationType="slide" onRequestClose={closeUserSheet}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
            activeOpacity={1}
            onPress={closeUserSheet}
          />
          <View className="rounded-t-3xl bg-card pb-8">
            <View className="items-center pt-3">
              <View className="h-1.5 w-10 rounded-full bg-white/20" />
            </View>

            {sheetUser && (
              <View className="px-5 pt-4">
                <View className="flex-row items-center gap-3 pb-4 border-b border-white/10">
                  <LinearGradient
                    colors={["#7A1EFF", "#D84CFF"]}
                    className="h-11 w-11 items-center justify-center rounded-full"
                  >
                    <Text className="text-white text-sm font-bold">{sheetUser.initials}</Text>
                  </LinearGradient>
                  <Text className="text-foreground text-base font-bold">{sheetUser.who}</Text>
                </View>

                <TouchableOpacity
                  onPress={confirmReport}
                  activeOpacity={0.8}
                  className="flex-row items-center gap-3 py-4"
                >
                  <Flag color="#FF8A2A" size={18} strokeWidth={2} />
                  <Text className="text-foreground text-sm font-semibold">Report user</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={confirmBlock}
                  activeOpacity={0.8}
                  className="flex-row items-center gap-3 py-4"
                >
                  <Ban color="#F04438" size={18} strokeWidth={2} />
                  <Text className="text-red-500 text-sm font-semibold">Block user</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={closeUserSheet}
                  activeOpacity={0.8}
                  className="mt-2 items-center rounded-2xl bg-white/10 py-3"
                >
                  <Text className="text-white text-sm font-semibold">Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
