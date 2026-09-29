import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import { styled } from 'nativewind';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const LinearGradient = styled(RNLinearGradient);

const CrewOnline = ({ id, name, initials, online }: FriendProps) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!online) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1
    );
  }, [online, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value }],
  }));

  return (
    <View key={id} className="w-16 items-center">
      <View className="relative" style={{ opacity: online ? 1 : 0.4 }}>
        <LinearGradient
          colors={["#7A1EFF", "#D84CFF"]}
          className="h-14 w-14 items-center justify-center rounded-full border-2 border-primary/30"
        >
          <Text className="font-sans-bold text-base text-white">
            {initials}
          </Text>
        </LinearGradient>

        <View
          className="absolute bottom-0 right-0 h-4 w-4 items-center justify-center rounded-full border-2 border-background"
          style={{ backgroundColor: online ? '#FF8A2A' : '#3a3a42' }}
        >
          {online && (
            <Animated.View
              className="absolute h-4 w-4 rounded-full bg-accent"
              style={pulseStyle}
            />
          )}
          <View
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: online ? '#fff' : '#a3a3ab' }}
          />
        </View>
      </View>

      <Text
        numberOfLines={1}
        className="mt-2 text-[10px] font-sans-medium text-muted-foreground"
      >
        {name.split(" ")[0]}
      </Text>
    </View>
  )
}

export default CrewOnline