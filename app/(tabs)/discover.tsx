import { styled } from "nativewind";
import { Text, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
const SafeAreaView = styled(RNSafeAreaView);

const DiscoverScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <View>
        <Text className="text-white">DiscoverScreen</Text>
      </View>
    </SafeAreaView>
  )
}

export default DiscoverScreen