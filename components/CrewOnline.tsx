import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import { styled } from 'nativewind';
import { Text, View } from 'react-native';

const LinearGradient = styled(RNLinearGradient);

const CrewOnline = ({ id, name, initials }: FriendProps) => {
  return (
    <View key={id} className="w-16 items-center">
      <View className="relative">
        <LinearGradient
          colors={["#7A1EFF", "#D84CFF"]}
          className="h-14 w-14 items-center justify-center rounded-full border-2 border-primary/30"
        >
          <Text className="font-sans-bold text-base text-white">
            {initials}
          </Text>
        </LinearGradient>

        <View className="absolute bottom-0 right-0 h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-accent">
          <View className="h-1.5 w-1.5 rounded-full bg-white" />
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