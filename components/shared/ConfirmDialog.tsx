import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { styled } from "nativewind";
import { Modal, Text, TouchableOpacity, View } from "react-native";

const LinearGradient = styled(RNLinearGradient);

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button for a destructive action (default), violet gradient otherwise. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * `Alert.alert` is a documented no-op on web (react-native-web ships an empty stub) — this is
 * the cross-platform replacement for any confirm-before-destructive-action flow that needs to
 * work in the browser too, not just native.
 */
export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Keep it",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityLabel={title}
    >
      <View
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
        className="items-center justify-center px-8"
      >
        <View className="w-full items-center rounded-3xl border border-border bg-card p-6">
          <Text className="text-foreground text-lg font-bold text-center">{title}</Text>
          <Text className="mt-2 text-muted-foreground text-sm text-center leading-relaxed">
            {message}
          </Text>

          <View className="mt-6 w-full flex-row gap-3">
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              className="h-12 flex-1 items-center justify-center rounded-2xl border border-border"
            >
              <Text className="text-foreground text-sm font-semibold">{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={destructive ? ["#E5484D", "#B91C1C"] : ["#7A1EFF", "#D84CFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-12 items-center justify-center rounded-2xl"
              >
                <Text className="text-white text-sm font-semibold">{confirmLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
