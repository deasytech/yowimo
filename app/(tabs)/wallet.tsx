import { styled } from "nativewind";
import { Text, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
const SafeAreaView = styled(RNSafeAreaView);

const WalletScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <View>
        <Text className='text-white'>WalletScreen</Text>
      </View>
    </SafeAreaView>
  )
}

export default WalletScreen