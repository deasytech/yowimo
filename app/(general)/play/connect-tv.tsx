import GoBack from "@/components/shared/GoBack";
import { LinearGradient as RNLinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Tv,
  Wifi
} from "lucide-react-native";
import { styled } from "nativewind";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const LinearGradient = styled(RNLinearGradient);
const SafeAreaView = styled(RNSafeAreaView);

export default function ConnectTVScreen() {
  const devices = [
    {
      id: 1,
      name: "Living Room TV",
      type: "Chromecast",
      status: "Ready",
    },
    {
      id: 2,
      name: "Bedroom Apple TV",
      type: "AirPlay",
      status: "Ready",
    },
    {
      id: 3,
      name: "Office Fire Stick",
      type: "Fire TV",
      status: "Idle",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Connect To TV" />
        {/* QR Card */}
        <LinearGradient
          colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mt-4 items-center rounded-3xl p-8"
        >
          <View className="relative">
            {/* Glow */}
            <View className="absolute inset-0 rounded-3xl bg-white/20" />
            {/* QR Container */}
            <View className="h-32 w-32 items-center justify-center rounded-3xl bg-white">
              <QRCode
                value="https://yowimo.tv/join/YW-2842"
                size={112}
                backgroundColor="white"
                color="black"
              />
            </View>
          </View>
          <Text className="mt-5 font-sg-extrabold text-3xl text-white">
            YW-2842
          </Text>
          <Text className="mt-2 text-center text-sm text-white/85">
            Scan on TV or enter the code at
          </Text>
          <Text className="mt-1 font-sans-semibold text-white">
            yowimo.tv
          </Text>
        </LinearGradient>
        {/* Nearby Devices */}
        <View className="mt-6">
          <View className="mb-3 flex-row items-center">
            <Wifi
              size={16}
              color="#B03BFF"
            />
            <Text className="ml-2 font-sg-bold text-base text-white">
              Nearby Devices
            </Text>
          </View>
          {devices.map((device) => (
            <TouchableOpacity
              key={device.id}
              activeOpacity={0.9}
              onPress={() => router.back()}
              className="mb-3 flex-row items-center justify-between rounded-2xl border border-white/10 bg-card p-4"
            >
              <View className="flex-row items-center">
                <LinearGradient
                  colors={["#7A1EFF", "#D84CFF"]}
                  className="h-11 w-11 items-center justify-center rounded-2xl"
                >
                  <Tv
                    size={20}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <View className="ml-3">
                  <Text className="text-sm font-sans-semibold text-white">
                    {device.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {device.type}
                  </Text>
                </View>
              </View>
              <View
                className={
                  device.status === "Ready"
                    ? "rounded-full bg-emerald-500/20 px-3 py-1"
                    : "rounded-full bg-white/10 px-3 py-1"
                }
              >
                <Text
                  className={
                    device.status === "Ready"
                      ? "text-[10px] font-sans-semibold text-emerald-400"
                      : "text-[10px] font-sans-semibold text-muted-foreground"
                  }
                >
                  {device.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}