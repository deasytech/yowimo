import { posthog } from "@/lib/posthog";
import { useClerk, useUser } from "@clerk/expo";
import { styled } from "nativewind";
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const ProfileScreen = () => {
  const { signOut } = useClerk();
  const { user } = useUser();

  const displayName = user?.firstName || user?.fullName || user?.emailAddresses[0]?.emailAddress || 'User';

  const handleSignOut = async () => {
    try {
      await signOut();
      posthog.capture('sign_out_completed');
      posthog.reset();
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 100, gap: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-1 pt-20">
          <Text className="text-sm text-muted-foreground">Hi, {displayName}</Text>
          <View className="flex-row flex-wrap items-center gap-2">
            <Pressable onPress={handleSignOut} className="px-3 py-2 bg-accent rounded">
              <Text className="text-white">Sign out</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default ProfileScreen