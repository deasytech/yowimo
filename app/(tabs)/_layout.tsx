import Header from "@/components/Header";
import { useAuth } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Tabs, useSegments } from "expo-router";
import { Compass, Home, Plus, User, Wallet } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

const PulsingPlusIcon = () => {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });

  return (
    <View style={{ marginTop: -30, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: "#D84CFF",
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: "#7A1EFF",
          opacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.3],
          }),
          transform: [
            {
              scale: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.18],
              }),
            },
          ],
        }}
      />
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Plus color="#fff" size={28} strokeWidth={2.6} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const TabLayout = () => {

  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const hideHeader = segments[1] === "discover";

  // Wait for auth to load before rendering anything
  if (!isLoaded) {
    return null;
  }

  // Redirect to sign-in if user is not authenticated
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <>
      {!hideHeader && <Header />}

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            marginHorizontal: 16,
            bottom: 16,
            height: 70,
            borderRadius: 24,
            backgroundColor: "#19191F",
            borderTopWidth: 0,
            elevation: 10,
          },
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#A3A3AB",
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIconStyle: { marginTop: 6 },
            tabBarIcon: ({ color, size, focused }) => (
              <Home color={color} size={focused ? size + 2 : size} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: "Discover",
            tabBarIconStyle: { marginTop: 6 },
            tabBarIcon: ({ color, size, focused }) => (
              <Compass color={color} size={focused ? size + 2 : size} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />
        <Tabs.Screen
          name="play"
          options={{
            title: "Play",
            tabBarIcon: () => <PulsingPlusIcon />,
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: "Wallet",
            tabBarIconStyle: { marginTop: 6 },
            tabBarIcon: ({ color, size, focused }) => (
              <Wallet color={color} size={focused ? size + 2 : size} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIconStyle: { marginTop: 6 },
            tabBarIcon: ({ color, size, focused }) => (
              <User color={color} size={focused ? size + 2 : size} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  )
};

export default TabLayout;