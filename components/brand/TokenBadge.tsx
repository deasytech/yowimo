import { formatTokenAmount } from "@/lib/utils";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Coins } from "lucide-react-native";
import { styled } from "nativewind";
import { ActivityIndicator, Text } from "react-native";

const LinearGradient = styled(RNLinearGradient);

interface TokenBadgeProps {
  /** null/undefined renders "—" — use only once the real balance is known, never as a
   * stand-in for zero. */
  amount: number | null | undefined;
  /** Shows a spinner in place of the amount while the balance is still loading. */
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TokenBadge({
  amount,
  loading = false,
  size = "md",
  className = "",
}: TokenBadgeProps) {
  const config = {
    sm: {
      height: "h-7",
      padding: "px-2.5",
      text: "text-xs",
      icon: 12,
      gap: "gap-1",
    },
    md: {
      height: "h-9",
      padding: "px-3",
      text: "text-sm",
      icon: 16,
      gap: "gap-1.5",
    },
    lg: {
      height: "h-11",
      padding: "px-4",
      text: "text-base",
      icon: 20,
      gap: "gap-2",
    },
  };

  const current = config[size];

  return (
    <LinearGradient
      colors={["#FFD54A", "#FF8A2A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={`flex-row items-center rounded-full ${current.height} ${current.padding} ${current.gap} ${className}`}
    >
      <Coins
        size={current.icon}
        color="#1E1E24"
        strokeWidth={2.5}
      />

      {loading ? (
        <ActivityIndicator size="small" color="#1E1E24" />
      ) : (
        <Text
          className={`font-sans-bold ${current.text} text-ink`}
        >
          {amount == null ? "—" : formatTokenAmount(amount)}
        </Text>
      )}
    </LinearGradient>
  );
}