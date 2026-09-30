import { Image } from "expo-image";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { styled } from "nativewind";
import { Text } from "react-native";

const LinearGradient = styled(RNLinearGradient);

interface AvatarProps {
  avatarUrl?: string | null;
  initials: string;
  size?: number;
}

/** A remote avatar, or a gradient + initials fallback when the URL is absent — the pattern the
 * Foundation notes call for everywhere a resource has an `avatar_url`. */
export default function Avatar({ avatarUrl, initials, size = 44 }: Readonly<AvatarProps>) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ height: size, width: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }

  return (
    <LinearGradient
      colors={["#7A1EFF", "#D84CFF"]}
      className="items-center justify-center"
      style={{ height: size, width: size, borderRadius: size / 2 }}
    >
      <Text className="font-sans-bold text-white" style={{ fontSize: size * 0.32 }}>
        {initials}
      </Text>
    </LinearGradient>
  );
}
