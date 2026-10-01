import { Text, TouchableOpacity, View } from "react-native";

/** "Couldn't load X" + optional error detail + Retry, centered under a horizontal rail
 * (home screen's crew/live-parties/decks sections). */
export default function RailError({
  message,
  detail,
  onRetry,
}: Readonly<{ message: string; detail?: string; onRetry: () => void }>) {
  return (
    <View className="items-center gap-2 py-4">
      <Text className="text-sm font-sans-medium text-white/60">{message}</Text>
      {detail && <Text className="text-xs text-white/40 text-center px-6">{detail}</Text>}
      <TouchableOpacity onPress={onRetry} activeOpacity={0.8}>
        <Text className="text-violet-bright text-sm font-sans-semibold">Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
