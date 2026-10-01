import { Text, TouchableOpacity, View } from "react-native";

/** Compact inline "couldn't load X — Retry" row for a section that still renders its heading
 * even when its own data failed (e.g. a card/list embedded further down a larger screen). */
export default function InlineRetry({
  message,
  onRetry,
}: Readonly<{ message: string; onRetry: () => void }>) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-sm text-white/40">{message}</Text>
      <TouchableOpacity onPress={onRetry} activeOpacity={0.8}>
        <Text className="text-sm font-sans-semibold text-violet-bright">Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
