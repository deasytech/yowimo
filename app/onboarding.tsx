import { posthog } from "@/lib/posthog";
import React, { useEffect } from 'react'
import { Text, View } from 'react-native'

const Onboarding = () => {
  useEffect(() => {
    posthog.capture('onboarding_viewed');
  }, []);

  return (
    <View>
      <Text>onboarding</Text>
    </View>
  )
}

export default Onboarding