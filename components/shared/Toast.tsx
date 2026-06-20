import { Check } from "lucide-react-native";
import React, { ReactNode } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ToastProps {
  /** The animated opacity value from useToast */
  opacity: Animated.Value;
  /** Whether the toast content should be rendered */
  isVisible: boolean;
  /** The message to display */
  message: string;
  /** Vertical offset from top (default: safa area top + 60) */
  topOffset?: number;
  /** Icon to show before the message. Pass null for no icon. Default: Check */
  icon?: ReactNode;
  /** Background colour class (default: bg-green-600) */
  bgClass?: string;
}

const Toast = ({
  opacity,
  isVisible,
  message,
  topOffset,
  icon,
  bgClass = "bg-green-600",
}: ToastProps) => {
  const insets = useSafeAreaInsets();
  const paddingTop = topOffset ?? Math.max(insets.top, 16) + 60;

  return (
    <Animated.View
      pointerEvents="none"
      style={{ opacity }}
      className="absolute inset-x-0 top-0 items-center z-50"
    >
      {isVisible && (
        <View
          style={{ paddingTop }}
          className="w-full items-center"
        >
          <View
            className={`flex-row items-center gap-2 rounded-full ${bgClass} px-5 py-3 shadow-lg`}
          >
            {icon !== null && (icon ?? <Check color="#fff" size={16} strokeWidth={3} />)}
            <Text className="text-white text-sm font-semibold">{message}</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

export default Toast;