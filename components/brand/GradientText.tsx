import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Text, TextProps } from "react-native";

interface GradientTextProps extends TextProps {
  colors?: readonly [string, string, ...string[]];
  className?: string;
}

export const GradientText = ({
  colors = ["#7A1EFF", "#ff8a2a"],
  className,
  children,
  ...props
}: GradientTextProps) => (
  <MaskedView
    maskElement={
      <Text className={className} {...props}>
        {children}
      </Text>
    }
  >
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <Text className={className} style={{ opacity: 0 }} {...props}>
        {children}
      </Text>
    </LinearGradient>
  </MaskedView>
);