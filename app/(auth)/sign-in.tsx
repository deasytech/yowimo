import { Link } from 'expo-router'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const SignIn = () => {
  return (
    <SafeAreaView>
      <View>
        <Text>Sign in screen</Text>
        <Link href="/" className='bg-accent p-4 rounded-2xl text-white w-fit'>Go to Home</Link>
      </View>
    </SafeAreaView>
  )
}

export default SignIn