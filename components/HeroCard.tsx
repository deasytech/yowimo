import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { styled } from "nativewind";
import { Text, TouchableOpacity, View } from 'react-native';
const LinearGradient = styled(RNLinearGradient);

const HeroCard = () => {
  return (
    <LinearGradient
      colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="overflow-hidden rounded-3xl p-6"
    >
      <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />

      <View className="self-start rounded-full border border-white/15 bg-white/10 px-3 py-1">
        <View className="flex-row items-center gap-1.5">
          <Sparkles
            color="#FFFFFF"
            size={12}
            strokeWidth={2}
          />

          <Text className="font-sans-bold text-xs uppercase tracking-wider text-white">
            AI Host on Duty
          </Text>
        </View>
      </View>

      <Text className="mt-3 font-sg-bold text-3xl leading-5 text-white">
        Spin up a party in 30 seconds.
      </Text>

      <Text className="mt-1 text-sm text-white/80">
        Friends, family, or strangers — your call.
      </Text>

      <View className="mt-5 flex-row gap-2">
        <TouchableOpacity activeOpacity={0.88} className="rounded-full bg-white px-5 py-2.5 items-center">
          <Text className="font-sans-bold text-sm text-background">
            Create Party
          </Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.66} className="rounded-full border border-white/15 bg-white/10 px-4 py-2.5 items-center">
          <Text className="font-sans-bold text-sm text-white">
            +15 Token Quest
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )
}

export default HeroCard