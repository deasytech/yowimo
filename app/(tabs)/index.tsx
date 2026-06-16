import "@/global.css";
import { Link } from "expo-router";
import { styled } from "nativewind";
import { Text } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <Text className="text-5xl text-violet font-sans-semibold mb-4">
                Home
            </Text>
            <Link href="/onboarding" className="bg-violet text-white rounded-2xl px-4 py-2 mb-4">
                <Text className="text-md font-sg-bold">
                    Onboarding
                </Text>
            </Link>
            <Link href="/(auth)/sign-in" className="bg-violet text-white rounded-2xl px-4 py-2 mb-2">
                <Text className="text-md">
                    Sign In
                </Text>
            </Link>
            <Link href="/(auth)/sign-up" className="bg-violet text-white rounded-2xl px-4 py-2">
                <Text className="text-md">
                    Sign Up
                </Text>
            </Link>
        </SafeAreaView>
    );
}