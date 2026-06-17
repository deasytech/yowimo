import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const QuickDeckCard = ({
  game,
  width,
  height,
  onPress,
}: GameCardProps) => {

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="overflow-hidden rounded-3xl"
      style={{
        width,
        height,
      }}
    >
      <Image
        source={game.image}
        resizeMode="cover"
        style={{
          width,
          height,
        }}
      />

      {/* Color Overlay */}
      <LinearGradient
        colors={[
          `${game.gradient[0]}80`,
          `${game.gradient[1]}40`,
        ]}
        className="absolute inset-0"
      />

      {/* Bottom Scrim */}
      <LinearGradient
        colors={[
          "transparent",
          "rgba(0,0,0,0.8)",
        ]}
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: height * 0.65,
        }}
      />

      {/* Content */}
      <View className="absolute inset-0 justify-between p-3.5">
        <Text className="text-[28px]">
          {game.emoji}
        </Text>

        <View>
          <Text className="text-[15px] font-bold leading-5 text-white" numberOfLines={1}>
            {game.name}
          </Text>

          <Text className="mt-1 text-[11px] text-white/85">
            {game.tagline}
          </Text>

          <View className="mt-1 flex-row gap-1.5">
            <View className="rounded-full bg-black px-2 py-0.5">
              <Text className="text-[10px] font-medium text-white">
                {game.intensity}
              </Text>
            </View>

            {game.cost > 0 && (
              <View className="rounded-full bg-white/20 px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-white">
                  🪙 {game.cost}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default QuickDeckCard