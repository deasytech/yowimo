import { clsx } from "clsx";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { Coins } from "lucide-react-native";
import { styled } from "nativewind";
import { Text } from "react-native";

const LinearGradient = styled(RNLinearGradient);

interface TokenBadgeProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function TokenBadge({
  amount,
  size = "md",
  className,
}: TokenBadgeProps) {
  const sizes = {
    sm: {
      container: "h-7 px-2.5",
      text: "text-xs",
      icon: 12,
      gap: "gap-1",
    },
    md: {
      container: "h-9 px-3",
      text: "text-sm",
      icon: 16,
      gap: "gap-1.5",
    },
    lg: {
      container: "h-11 px-4",
      text: "text-base",
      icon: 20,
      gap: "gap-2",
    },
  };

  const current = sizes[size];

  return (
    <LinearGradient
      colors={["#FACC15", "#FF8A2A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={clsx(
        "flex-row items-center rounded-full",
        current.container,
        current.gap,
        className
      )}
    >
      <Coins
        size={current.icon}
        color="#0D0D12"
        strokeWidth={2.5}
      />

      <Text
        className={clsx(
          "font-sans-semibold text-background",
          current.text
        )}
      >
        {amount.toLocaleString()}
      </Text>
    </LinearGradient>
  );
}